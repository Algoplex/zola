type FeedbackFormProps = {
  authUserId?: string
  onClose: () => void
}

// Feedback form disabled - no auth/DB
export function FeedbackForm({ onClose: _onClose }: FeedbackFormProps) {
  return null
}
