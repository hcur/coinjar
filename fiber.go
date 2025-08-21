package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

	if err := db.AutoMigrate(&CheckingAccount{}, &SavingsAccount{}, &BrokerageAccount{}, &Transaction{}, &Asset{}); err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("Database connected and migrated successfully")
}

/* Fiber */

func main() {
	createDatabase()

	app := fiber.New()

	// Enable CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173, http://127.0.0.1:5173",
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: "GET, POST, PUT, DELETE",
	}))

	app.Get("/health", healthCheck)

	api := app.Group("/api/v1")

	// accounts
	api.Get("/account", getAccounts)
	api.Post("/account", newAccount)
	api.Delete("/account/:id", deleteAccount)

	// transaction
	api.Get("/transactions", getAllTransactions)
	api.Get("/transactions/by-account/:account_id", getTransactionsByAccount)
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

	if request.Type == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Account type is required",
		})
	}

	// create account based on type
	var account interface{}
	var err error

	switch request.Type {
	case "checking":
		checkingAccount := &CheckingAccount{
			CashAccount: CashAccount{
				BaseAccount: BaseAccount{
					ID:   uuid.New(),
					Name: request.Name,
					Type: request.Type,
				},
				Balance: request.Balance,
			},
			RoutingNumber: "", // Will be set later if needed
			AccountNumber: "", // Will be set later if needed
		}
		account = checkingAccount
		err = db.Create(checkingAccount).Error

	case "savings":
		savingsAccount := &SavingsAccount{
			CashAccount: CashAccount{
				BaseAccount: BaseAccount{
					ID:   uuid.New(),
					Name: request.Name,
					Type: request.Type,
				},
				Balance: request.Balance,
			},
			APR:         0.0, // Default APR
			Compounding: 12,  // Default to monthly compounding
		}
		account = savingsAccount
		err = db.Create(savingsAccount).Error

	case "brokerage":
		brokerageAccount := &BrokerageAccount{
			BaseAccount: BaseAccount{
				ID:   uuid.New(),
				Name: request.Name,
				Type: request.Type,
			},
			AccountNumber: "", // Will be set later if needed
			BrokerName:    "", // Will be set later if needed
		}
		account = brokerageAccount
		err = db.Create(brokerageAccount).Error

	default:
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"message": "Invalid account type. Must be 'checking', 'savings', or 'brokerage'",
		})
	}

	if err != nil {
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
	// We need to fetch each account type separately since they're in different tables
	var checkingAccounts []CheckingAccount
	var savingsAccounts []SavingsAccount
	var brokerageAccounts []BrokerageAccount

	// Fetch all account types
	if err := db.Find(&checkingAccounts).Error; err != nil {
		log.Printf("Failed to fetch checking accounts: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": "Failed to fetch accounts",
		})
	}

	if err := db.Find(&savingsAccounts).Error; err != nil {
		log.Printf("Failed to fetch savings accounts: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": "Failed to fetch accounts",
		})
	}

	if err := db.Find(&brokerageAccounts).Error; err != nil {
		log.Printf("Failed to fetch brokerage accounts: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": "Failed to fetch accounts",
		})
	}

	// Combine all accounts into a single response
	allAccounts := make([]interface{}, 0)
	for _, acc := range checkingAccounts {
		allAccounts = append(allAccounts, acc)
	}
	for _, acc := range savingsAccounts {
		allAccounts = append(allAccounts, acc)
	}
	for _, acc := range brokerageAccounts {
		allAccounts = append(allAccounts, acc)
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"accounts": allAccounts,
		"count":    len(allAccounts),
	})
}

// url: DELETE /api/v1/account/:id
func deleteAccount(c *fiber.Ctx) error {
	id := c.Params("id")

	accountUUID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid account ID",
			"message": "Account ID must be a valid UUID",
		})
	}

	// Check if account exists in any of the account tables
	var account interface{}
	var accountType string
	var found bool

	// Try checking accounts first
	var checkingAccount CheckingAccount
	if err := db.First(&checkingAccount, accountUUID).Error; err == nil {
		account = checkingAccount
		accountType = "checking"
		found = true
	}

	// Try savings accounts
	if !found {
		var savingsAccount SavingsAccount
		if err := db.First(&savingsAccount, accountUUID).Error; err == nil {
			account = savingsAccount
			accountType = "savings"
			found = true
		}
	}

	// Try brokerage accounts
	if !found {
		var brokerageAccount BrokerageAccount
		if err := db.First(&brokerageAccount, accountUUID).Error; err == nil {
			account = brokerageAccount
			accountType = "brokerage"
			found = true
		}
	}

	if !found {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error":   "Not found",
			"message": "Account not found",
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
			"error":   "Database error",
			"message": "Failed to delete account",
		})
	}

	// Extract account info based on type
	var accountID uuid.UUID
	var accountName string

	switch accountType {
	case "checking":
		if acc, ok := account.(CheckingAccount); ok {
			accountID = acc.ID
			accountName = acc.Name
		}
	case "savings":
		if acc, ok := account.(SavingsAccount); ok {
			accountID = acc.ID
			accountName = acc.Name
		}
	case "brokerage":
		if acc, ok := account.(BrokerageAccount); ok {
			accountID = acc.ID
			accountName = acc.Name
		}
	}

	log.Printf("Deleted account: %s (%s) with %d transactions", accountName, accountID, transactionCount)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Account deleted successfully",
		"deleted_account": fiber.Map{
			"id":   accountID,
			"name": accountName,
		},
		"deleted_transactions": transactionCount,
	})
}

// url: GET /api/v1/transactions
func getAllTransactions(c *fiber.Ctx) error {
	var transactions []Transaction

	// Get all transactions ordered by date (most recent first)
	if err := db.Order("date DESC").Find(&transactions).Error; err != nil {
		log.Printf("Failed to fetch all transactions: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": "Failed to fetch transactions",
		})
	}

	// Note: Account information is not preloaded here since we have multiple account types
	// If needed, account info can be fetched separately using the AccountID

	return c.JSON(fiber.Map{
		"success":      true,
		"transactions": transactions,
		"count":        len(transactions),
	})
}

// url: GET /api/v1/transactions/by-account/:account_id
func getTransactionsByAccount(c *fiber.Ctx) error {
	accountID := c.Params("account_id")

	accountUUID, err := uuid.Parse(accountID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid account ID",
			"message": "Account ID must be a valid UUID",
		})
	}

	// Check if account exists in any of the account tables
	var account interface{}
	var found bool

	// Try checking accounts first
	var checkingAccount CheckingAccount
	if err := db.First(&checkingAccount, accountUUID).Error; err == nil {
		account = checkingAccount
		found = true
	}

	// Try savings accounts
	if !found {
		var savingsAccount SavingsAccount
		if err := db.First(&savingsAccount, accountUUID).Error; err == nil {
			account = savingsAccount
			found = true
		}
	}

	// Try brokerage accounts
	if !found {
		var brokerageAccount BrokerageAccount
		if err := db.First(&brokerageAccount, accountUUID).Error; err == nil {
			account = brokerageAccount
			found = true
		}
	}

	if !found {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Account not found",
		})
	}

	// Get transactions for this account, ordered by date (most recent first)
	var transactions []Transaction
	if err := db.Where("account_id = ?", accountUUID).Order("date DESC").Find(&transactions).Error; err != nil {
		log.Printf("Failed to fetch transactions for account %s: %v", accountID, err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
			"message": "Failed to fetch transactions",
		})
	}

	return c.JSON(fiber.Map{
		"success":      true,
		"account":      account,
		"transactions": transactions,
		"count":        len(transactions),
	})
}

// url: POST /api/v1/transaction/add
func addTransaction(c *fiber.Ctx) error {
	var request Request_newTransaction
	if err := c.BodyParser(&request); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid request body",
			"message": err.Error(),
		})
	}

	// make sure the account referenced exists and is a cash account
	var checkingAccount CheckingAccount
	var savingsAccount SavingsAccount
	var found bool
	var accountType string

	// Try checking accounts first
	if err := db.First(&checkingAccount, "id = ?", request.Account).Error; err == nil {
		found = true
		accountType = "checking"
	}

	// Try savings accounts
	if !found {
		if err := db.First(&savingsAccount, "id = ?", request.Account).Error; err == nil {
			found = true
			accountType = "savings"
		}
	}

	if !found {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{
			"error": "Account not found or is not a cash account (brokerage accounts don't support transactions)",
		})
	}

	transaction := Transaction{
		ID:        uuid.New(),
		AccountID: request.Account,
		Source:    request.Source,
		Date:      request.Date,
		Amount:    request.Amount,
		Note:      request.Note,
	}

	// save to database
	if err := db.Create(&transaction).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create transaction",
		})
	}

	// saved to database; update account balance
	// Update the appropriate account type
	switch accountType {
	case "checking":
		checkingAccount.Balance += transaction.Amount
		if err := db.Save(&checkingAccount).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update checking account balance",
			})
		}
	case "savings":
		savingsAccount.Balance += transaction.Amount
		if err := db.Save(&savingsAccount).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update savings account balance",
			})
		}
	}

	return c.Status(201).JSON(transaction)
}

// url: DELETE /api/v1/transaction/:id
func deleteTransaction(c *fiber.Ctx) error {
	transactionID := c.Params("id")

	transactionUUID, err := uuid.Parse(transactionID)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   "Invalid transaction ID",
			"message": "Transaction ID must be a valid UUID",
		})
	}

	// delete transaction from db
	var transaction Transaction
	if err := db.First(&transaction, transactionUUID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(http.StatusNotFound).JSON(fiber.Map{
				"error":   "Not found",
				"message": "Transaction not found",
			})
		}
		log.Printf("Failed to fetch transaction for deletion: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Database error",
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
