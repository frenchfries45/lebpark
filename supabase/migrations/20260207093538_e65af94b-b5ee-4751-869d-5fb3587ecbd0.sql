-- Allow public update on payments
CREATE POLICY "Allow public update payments"
ON public.payments
FOR UPDATE
USING (true);

-- Allow public delete on payments
CREATE POLICY "Allow public delete payments"
ON public.payments
FOR DELETE
USING (true);