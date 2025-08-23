package main

import (
	"time"

	"github.com/google/uuid"
)

const (
	ASSET = 1
	DEBT = -1
)

/* Account */

// Base account type
type Account interface {
	GetID() uuid.UUID
	GetName() string
	GetType() string
	GetCategory() int
}

type BaseAccount struct {
	ID   uuid.UUID `json:"id" gorm:"primaryKey"`
	Name string    `json:"name" gorm:"not null"`
	Type string    `json:"type" gorm:"not null"`
	Category int   `json:"category" gorm:"not null"`
}

// Specific account type
type CashAccount struct {
	// Base account information
	BaseAccount
	Balance float32       `json:"balance" gorm:"default:0"`
	History []Transaction `json:"history,omitempty" gorm:"foreignKey:AccountID"`
}

type CheckingAccount struct {
	CashAccount
}

type CreditAccount struct {
	CashAccount
}

type SavingsAccount struct {
	CashAccount
	InterestRate float32 `json:"interest_rate" gorm:"default:0"`
	Compounding  int     `json:"compounding" gorm:"default:12"`
}

type BrokerageAccount struct {
	BaseAccount
}

type Request_newAccount struct {
	Name    string  `json:"name" validate:"required"`
	Balance float32 `json:"balance"`
	Type    string  `json:"type" validate:"required"`
}

/* Transaction */

type Transaction struct {
	ID        uuid.UUID `json:"id" gorm:"primaryKey"`
	AccountID uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Source    string    `json:"source" gorm:"not null"`
	Date      time.Time `json:"date" gorm:"not null"`
	Amount    float32   `json:"amount" gorm:"not null"`
	Note      string    `json:"note"`

	// GORM will automatically handle the foreign key relationship
	// based on the AccountID field
}

type Request_newTransaction struct {
	Account uuid.UUID `json:"account" validate:"required"`
	Source  string    `json:"source" validate:"required"`
	Date    time.Time `json:"date" validate:"required"`
	Amount  float32   `json:"amount" validate:"required"`
	Note    string    `json:"note"`
}

/* Asset */

type Asset struct {
	ID        uuid.UUID `json:"id" gorm:"primaryKey"`
	AccountID uuid.UUID `json:"account_id" gorm:"type:uuid;not null"`
	Ticker    string    `json:"ticker"`
	Quantity  int       `json:"quantity" gorm:"default:1"`
}
