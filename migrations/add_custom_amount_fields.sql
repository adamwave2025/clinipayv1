
-- Add is_custom_amount to payment_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payment_requests' 
                  AND column_name = 'is_custom_amount') THEN
        ALTER TABLE payment_requests ADD COLUMN is_custom_amount BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add custom_amount to payments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payments' 
                  AND column_name = 'custom_amount') THEN
        ALTER TABLE payments ADD COLUMN custom_amount INTEGER DEFAULT NULL;
    END IF;
END $$;

-- Update existing payment requests to set is_custom_amount = true where custom_amount is not null
UPDATE payment_requests 
SET is_custom_amount = TRUE 
WHERE custom_amount IS NOT NULL AND payment_link_id IS NULL;

-- Update existing payments based on their associated payment requests
UPDATE payments
SET custom_amount = pr.custom_amount
FROM payment_requests pr
WHERE pr.payment_id = payments.id AND pr.is_custom_amount = TRUE;
