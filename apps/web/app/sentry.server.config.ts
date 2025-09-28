import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Release tracking
    release: process.env.NEXT_PUBLIC_RELEASE || 'development',

    // Environment
    environment: process.env.NODE_ENV,

    // Error filtering
    beforeSend(event, hint) {
      // Add additional context
      event.tags = {
        ...event.tags,
        service: 'canopyiq-web',
      }

      // Log errors to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Sentry Event:', hint.originalException || hint.syntheticException)
      }

      return event
    },

    // Integrations
    integrations: [
      Sentry.extraErrorDataIntegration({
        depth: 5,
      }),
    ],
  })
}