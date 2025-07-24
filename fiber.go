package main

import (
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

/* SQLite */

var db *gorm.DB

func createDatabase() {
	var err error

	if err := os.MkdirAll("data", 0755); err != nil {
		log.Fatal("Server failed to create data directory: ", err)
	}

	db, err = gorm.Open(sqlite.Open("data/finance.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Server failed to connect to database: ", err)
	}

	if err := db.AutoMigrate(&Account{}, &Transaction{}); err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("Database connected and migrated successfully")
}

/* Fiber */

func main() {
	createDatabase()

	app := fiber.New()
	app.Get("/health", healthCheck)

	api := app.Group("/api/v1")

	// accounts
	api.Get("/account", getAccounts)
	api.Post("/account", newAccount)
	api.Delete("/account/:id", deleteAccount)

	// transaction
	api.Post("/transaction/add", addTransaction)
	api.Delete("/transaction/delete/:id", deleteTransaction)

	app.Listen("0.0.0.0:3001")
}

/* Fiber handlers */

// url: GET /health
func healthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "ok",
		"timestamp": time.Now(),
		"service":   "coinjar-api",
		"version":   "1.0.0",
	})
}

// url: POST /api/v1/account
func newAccount(c *fiber.Ctx) error {
	var request Request_newAccount
	if err := c.BodyParser(&request); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// sanity checking
	if request.Name == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Account name is required",
		})
	}

	// create object
	account := Account{
		ID:      uuid.New(),
		Name:    request.Name,
		Balance: request.Balance,
		History: []Transaction{},
	}

	// save to sqlite
	if err := db.Create(&account).Error; err != nil {
		log.Printf("Server failed to create account: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": "Failed to create account",
		})
	}

	log.Printf("Created account: %+v", account)

	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"message": "Account created successfully",
		"account": account,
	})
}

// url: GET /api/v1/account
func getAccounts(c *fiber.Ctx) error {
	var accounts []Account

	if err := db.Find(&accounts).Error; err != nil {
		log.Printf("Failed to fetch accounts: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database error",
			"message": "Failed to fetch accounts",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"accounts": accounts,
		"count": len(accounts),
	})
}

// url: DELETE /api/v1/account/:id
func deleteAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	accountUUID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid account ID",
			"message": "Account ID must be a valid UUID",
		})
	}

	var account Account
	if err := db.First(&account, accountUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Not found",
				"message": "Account not found",
			})
		}
		log.Printf("Failed to fetch account for deletion: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database error",
			"message": "Failed to fetch account",
		})
	}

	var transactionCount int64
	db.Model(&Transaction{}).Where("account_id = ?", accountUUID).Count(&transactionCount)

	err = db.Transaction(func(tx *gorm.DB) error {
		if transactionCount > 0 {
			if err := tx.Where("account_id = ?", accountUUID).Delete(&Transaction{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Delete(&account).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database error",
			"message": "Failed to delete account",
		})
	}

	log.Printf("Deleted account: %s (%s) with %d transactions", account.Name, account.ID, transactionCount)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Account deleted successfully",
		"deleted_account": fiber.Map{
			"id": account.ID,
			"name": account.Name,
		},
		"deleted_transactions": transactionCount,
	})
}

// url: POST /api/v1/transaction/add
func addTransaction(c *fiber.Ctx) error {
	var request Request_newTransaction
	if err := c.BodyParser(&request); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"message": err.Error(),
		})
	}

	// make sure the account referenced exists
	var account Account
	if err := db.First(&account, "id = ?", request.Account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(404).JSON(fiber.Map{
				"error": "Account not found",
			})
		}
		return c.Status(500).JSON(fiber.Map{
			"error": "Database error",
		})
	}
	
	transaction := Transaction{
		ID: uuid.New(),
		AccountID: request.Account,
		Source: request.Source,
		Date: request.Date,
		Amount: request.Amount,
		Note: request.Note,
	}

	// save to database
	if err := db.Create(&transaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create transaction",
		})
	}

	// saved to database; update account balance
	account.Balance += transaction.Amount;
	if err := db.Save(&account).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update account balance",
		})
	}

	return c.Status(201).JSON(transaction);
}

// url: DELETE /api/v1/transaction/:id
func deleteTransaction(c *fiber.Ctx) error {
	transactionID := c.Params("id")

	transactionUUID, err := uuid.Parse(transactionID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid account ID",
			"message": "Account ID must be a valid UUID",
		})
	}

	// delete transaction from db
	var transaction Transaction
	if err := db.First(&transaction, transactionUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error": "Not found",
				"message": "Transaction not found",
			})
		}
		log.Printf("Failed to fetch transaction for deletion: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database error",
			"message": "Failed to fetch transaction",
		})
	}

	if err := db.Delete(&Transaction{}, "id = ?", transactionUUID); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to delete transaction",
		})
	}

	return c.Status(204).Send(nil)
}
