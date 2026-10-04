-- LEGAL-02.6 (2 Oct 2026; decisions L and M): a subscriber's row is deleted when they unsubscribe,
-- when a sign-up is never confirmed, and 90 days after a hard bounce. The send records stay for the
-- per-issue counts, without the person: the link to the subscriber becomes NULL.
-- Additive in effect (decision M of D-WEB-27): the code serving before this release never deletes a
-- subscriber, so the changed rule cannot fire under it.
ALTER TABLE newsletter_sends DROP CONSTRAINT IF EXISTS newsletter_sends_subscriber_id_fkey;
ALTER TABLE newsletter_sends
  ADD CONSTRAINT newsletter_sends_subscriber_id_fkey
  FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE SET NULL;
