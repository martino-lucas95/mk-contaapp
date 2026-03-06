#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "📦 Agregando todos los cambios..."
git add -A

echo "💾 Commiteando..."
git commit -m "feat: panel contador completo - ClientsPage, ClientDetailPage, DashboardPage, CalendarPage, CredentialsPage" 2>/dev/null || echo "(nada nuevo para commitear)"

echo "⬇️  Pull con rebase..."
git pull --rebase origin main

echo "⬆️  Push..."
git push origin main

echo "✅ Listo! Git sincronizado."
