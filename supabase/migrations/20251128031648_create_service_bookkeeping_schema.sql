/*
  # Service Bookkeeping Application Schema

  ## Overview
  This migration creates the database schema for a Service Bookkeeping application
  that manages financial transactions and service catalog.

  ## New Tables

  ### 1. services
  Service catalog table to store reusable service items with pricing.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, not null) - Service name
  - `price` (numeric, not null) - Service price in IDR
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. transactions
  Financial transactions table to track income and expenses.
  - `id` (uuid, primary key) - Unique identifier
  - `date` (date, not null) - Transaction date
  - `description` (text, not null) - Transaction description
  - `amount` (numeric, not null) - Transaction amount in IDR
  - `type` (text, not null) - Transaction type: 'income' or 'expense'
  - `client` (text) - Client name (optional)
  - `payment_status` (text, not null) - Payment status: 'paid' or 'unpaid'
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Add policies for public access (suitable for single-user demo application)
  
  ## Notes
  - All numeric fields use PostgreSQL numeric type for precise currency calculations
  - Default values ensure data integrity
  - Indexes added for frequently queried columns
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  client text,
  payment_status text NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'unpaid')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo application)
CREATE POLICY "Enable read access for all users"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON services FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON services FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON services FOR DELETE
  USING (true);

CREATE POLICY "Enable read access for all users"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON transactions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON transactions FOR DELETE
  USING (true);