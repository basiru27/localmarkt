-- Notifications table
CREATE TABLE IF NOT EXISTS notifications
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- frontend route to navigate to on click
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW
(
)
    );
-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications(created_at DESC);
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Users can only see their own notifications
DROP
POLICY IF EXISTS "Users can view own notifications"
  ON notifications;
CREATE
POLICY "Users can view own notifications"
  ON notifications FOR
SELECT
    USING (auth.uid() = user_id);
-- Users can update their own notifications (mark as read)
DROP
POLICY IF EXISTS "Users can update own notifications"
  ON notifications;
CREATE
POLICY "Users can update own notifications"
  ON notifications FOR
UPDATE
    USING (auth.uid() = user_id);
-- Backend service can insert notifications for any user
DROP
POLICY IF EXISTS "Service can insert notifications"
  ON notifications;
CREATE
POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
DROP
POLICY IF EXISTS "Users can delete own notifications"
  ON notifications;
CREATE
POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
USING (auth.uid() = user_id);