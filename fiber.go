package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"

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

	if err := db.AutoMigrate(&Account{}); err != nil {
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

	api.Post("/accounts", newAccount)

	app.Listen("0.0.0.0:3001")
}

/* Fiber handlers */

// url: /health
func healthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "ok",
		"timestamp": time.Now(),
		"service":   "coinjar-api",
		"version":   "1.0.0",
	})
}

// url: POST /api/v1/accounts
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
		ID:      1, //TODO: generate ID key
		Name:    request.Name,
		Balance: request.Balance,
	}

	// save to sqlite
	if err := db.Create(&account).Error; err != nil {
		log.Printf("Server failed to create account: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database error",
			"message": "Failed to create account",
		})
	}

	log.Printf("Created account: %+v", account)

	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"message": "Account created successfully",
		"account": account,
	})
}
