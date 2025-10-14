#!/bin/bash

# Simple Docker script for Next.js app
# Usage: ./docker.sh [build|run|stop|logs|restart]

cd "$(dirname "$0")"

case "$1" in
  build)
    echo "🔨 Building Docker image..."
    set -a
    source .env
    set +a
    
    docker build -t nextjs-app \
      --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
      --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL="$NEXT_PUBLIC_CLERK_SIGN_IN_URL" \
      --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_URL="$NEXT_PUBLIC_CLERK_SIGN_UP_URL" \
      --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="$NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL" \
      --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="$NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL" \
      --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
      --build-arg NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID="$NEXT_PUBLIC_DODO_PAYMENT_SUBSCRIPTION_ID" \
      --build-arg NEXT_PUBLIC_DODO_PRODUCT_ID_PRO="$NEXT_PUBLIC_DODO_PRODUCT_ID_PRO" \
      --build-arg NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE="$NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE" \
      --build-arg NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION="$NEXT_PUBLIC_DODO_PRODUCT_ID_PRO_SUBSCRIPTION" \
      --build-arg NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE_SUBSCRIPTION="$NEXT_PUBLIC_DODO_PRODUCT_ID_ENTERPRISE_SUBSCRIPTION" \
      --build-arg DATABASE_URL="$DATABASE_URL" \
      --build-arg OPENAI_API_KEY="$OPENAI_API_KEY" \
      --build-arg EMBEDDING_MODEL="$EMBEDDING_MODEL" \
      --build-arg EMBEDDING_DIM="$EMBEDDING_DIM" \
      --build-arg CHAT_MODEL="$CHAT_MODEL" \
      --build-arg GOOGLE_GENERATIVE_AI_API_KEY="$GOOGLE_GENERATIVE_AI_API_KEY" \
      --build-arg GEMINI_API_KEY="$GEMINI_API_KEY" \
      --build-arg DODO_PAYMENTS_API_KEY="$DODO_PAYMENTS_API_KEY" \
      --build-arg DODO_PAYMENTS_WEBHOOK_KEY="$DODO_PAYMENTS_WEBHOOK_KEY" \
      --build-arg DODO_PAYMENTS_RETURN_URL="$DODO_PAYMENTS_RETURN_URL" \
      --build-arg DODO_PAYMENTS_ENVIRONMENT="$DODO_PAYMENTS_ENVIRONMENT" \
      --build-arg CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
      --build-arg CLERK_WEBHOOK_SECRET="$CLERK_WEBHOOK_SECRET" \
      --build-arg UPLOADTHING_TOKEN="$UPLOADTHING_TOKEN" \
      --build-arg UNSPLASH_API_KEY="$UNSPLASH_API_KEY" \
      --build-arg YOUTUBE_API_KEY="$YOUTUBE_API_KEY" \
      --build-arg SCRAPPER_API_KEY="$SCRAPPER_API_KEY" \
      --build-arg SCRAPE_DO_API_TOKEN="$SCRAPE_DO_API_TOKEN" \
      --build-arg PDFCO_API_KEY="$PDFCO_API_KEY" \
      --build-arg ELEVEN_LABS_WEBHOOK_SERCRET="$ELEVEN_LABS_WEBHOOK_SERCRET" \
      --build-arg ELEVENLABS_API_KEY="$ELEVENLABS_API_KEY" \
      --build-arg ELEVENLABS_BASE_URL="$ELEVENLABS_BASE_URL" \
      --build-arg WEBSITE_URL="$WEBSITE_URL" \
      .
    echo "✅ Build complete!"
    ;;
    
  run)
    echo "🚀 Starting container..."
    docker stop nextjs-app 2>/dev/null
    docker rm nextjs-app 2>/dev/null
    docker run -d -p 3000:3000 --name nextjs-app --env-file .env nextjs-app
    echo "✅ Container running at http://localhost:3000"
    ;;
    
  stop)
    echo "🛑 Stopping container..."
    docker stop nextjs-app
    docker rm nextjs-app
    echo "✅ Container stopped"
    ;;
    
  logs)
    echo "📋 Showing logs (Ctrl+C to exit)..."
    docker logs -f nextjs-app
    ;;
    
  restart)
    echo "🔄 Restarting container..."
    docker restart nextjs-app
    echo "✅ Container restarted"
    ;;
    
  *)
    echo "Usage: ./docker.sh [build|run|stop|logs|restart]"
    echo ""
    echo "Commands:"
    echo "  build   - Build the Docker image"
    echo "  run     - Run the container"
    echo "  stop    - Stop and remove the container"
    echo "  logs    - View container logs"
    echo "  restart - Restart the container"
    echo ""
    echo "Example: ./docker.sh build && ./docker.sh run"
    exit 1
    ;;
esac
