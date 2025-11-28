/*
  # Add Clients Management Table

  ## Overview
  This migration adds a clients table to manage customer information
  for the Service Bookkeeping application.

  ## New Tables

  ### clients
  Customer/client database table.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, not null) - Client/customer name
  - `phone` (text) - Phone number (optional)
  - `email` (text) - Email address (optional)
  - `notes` (text) - Additional notes about the client
  - `created_at` (timestamptz) - Record creation timestamp

  ## Changes to Existing Tables

  ### transactions
  - Modify `client` column to reference clients table (optional FK)
  - Keep as text to maintain backward compatibility

  ## Security
  - Enable Row Level Security (RLS) on clients table
  - Add policies for public access (suitable for single-user demo application)
  
  ## Notes
  - Phone and email are optional to allow flexibility
  - Existing transactions with text client names remain compatible
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo application)
CREATE POLICY "Enable read access for all users"
  ON clients FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON clients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON clients FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON clients FOR DELETE
  USING (true);