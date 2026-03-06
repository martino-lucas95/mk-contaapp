#!/bin/bash
# ContaApp — k3s Deployment Script
# MK Studios · Lucas Martino
#
# Uso: ./deploy.sh [build|deploy|all|seed|status|logs|restart|delete|argocd|help]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

if [ -f "$SCRIPT_DIR/versions.env" ]; then
    source "$SCRIPT_DIR/versions.env"
else
    echo "BACKEND_VERSION=1.0.2"  > "$SCRIPT_DIR/versions.env"
    echo "FRONTEND_VERSION=1.0.2" >> "$SCRIPT_DIR/versions.env"
    source "$SCRIPT_DIR/versions.env"
fi

NAMESPACE="contaapp"
PRODUCTION_URL="https://contapp.mkstudios.net"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

build_images() {
    log_info "Construyendo imágenes Docker..."
    cd "$PROJECT_ROOT/backend"
    docker build --no-cache -t contaapp-backend:$BACKEND_VERSION .
    cd "$PROJECT_ROOT/frontend"
    docker build --no-cache --build-arg VITE_API_URL=$PRODUCTION_URL -t contaapp-frontend:$FRONTEND_VERSION .
    log_info "Importando imágenes a k3s containerd..."
    docker save contaapp-backend:$BACKEND_VERSION  | sudo k3s ctr images import -
    docker save contaapp-frontend:$FRONTEND_VERSION | sudo k3s ctr images import -
    log_success "Imágenes construidas e importadas."
    sudo k3s ctr images ls | grep contaapp || log_warn "Imágenes no encontradas en k3s"
}

create_database() {
    log_info "Creando base de datos 'contaapp'..."
    POSTGRES_POD=$(kubectl get pods -n default -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -z "$POSTGRES_POD" ]; then
        log_warn "Pod Postgres no encontrado. Creá la DB manualmente:"
        echo "  kubectl exec -it <postgres-pod> -n default -- psql -U postgres -c 'CREATE DATABASE contaapp;'"
        return
    fi
    kubectl exec -it $POSTGRES_POD -n default -- \
        psql -U postgres -c "CREATE DATABASE contaapp;" 2>/dev/null \
        && log_success "Base de datos creada." \
        || log_info "La DB 'contaapp' ya existe."
}

deploy_k8s() {
    log_info "Desplegando en Kubernetes (namespace: $NAMESPACE)..."
    cd "$SCRIPT_DIR/k8s"
    kubectl apply -f namespace.yaml
    kubectl apply -f secret.yaml
    kubectl apply -f backend-deployment.yaml
    kubectl apply -f backend-service.yaml
    kubectl apply -f frontend-deployment.yaml
    kubectl apply -f frontend-service.yaml
    kubectl apply -f ingress.yaml
    log_info "Esperando pods..."
    kubectl wait --for=condition=ready pod -l app=contaapp-backend  -n $NAMESPACE --timeout=120s || log_warn "Backend pod no listo aún"
    kubectl wait --for=condition=ready pod -l app=contaapp-frontend -n $NAMESPACE --timeout=120s || log_warn "Frontend pod no listo aún"
    log_success "Deploy aplicado."
    show_status
}

run_seed() {
    log_info "Ejecutando seed en el pod del backend..."
    BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=contaapp-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [ -z "$BACKEND_POD" ]; then
        log_error "Pod backend no encontrado. Desplegá primero: ./deploy.sh deploy"
        exit 1
    fi
    kubectl exec -it $BACKEND_POD -n $NAMESPACE -- npm run seed
    log_success "Seed completado."
}

update_image() {
    log_info "Actualizando imágenes a backend:$BACKEND_VERSION / frontend:$FRONTEND_VERSION..."
    kubectl set image deployment/contaapp-backend  backend=docker.io/library/contaapp-backend:$BACKEND_VERSION  -n $NAMESPACE
    kubectl set image deployment/contaapp-frontend frontend=docker.io/library/contaapp-frontend:$FRONTEND_VERSION -n $NAMESPACE
    kubectl rollout status deployment/contaapp-backend  -n $NAMESPACE
    kubectl rollout status deployment/contaapp-frontend -n $NAMESPACE
    log_success "Imágenes actualizadas."
}

setup_argocd() {
    log_info "Registrando app en ArgoCD..."
    kubectl apply -f "$SCRIPT_DIR/k8s/argocd-app.yaml"
    log_success "App registrada en ArgoCD. Deploy automático desde branch main activado."
    echo "  Estado: kubectl get app contaapp -n argocd"
}

show_status() {
    echo ""
    echo "📦 Pods:"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
    echo "🔗 Services:"
    kubectl get svc -n $NAMESPACE
    echo ""
    echo "🌐 Ingress:"
    kubectl get ingress -n $NAMESPACE
    echo ""
    echo "🚀 $PRODUCTION_URL"
    echo ""
}

show_logs() {
    COMPONENT=${2:-backend}
    kubectl logs -f deployment/contaapp-$COMPONENT -n $NAMESPACE
}

restart_deployment() {
    kubectl rollout restart deployment/contaapp-backend  -n $NAMESPACE
    kubectl rollout restart deployment/contaapp-frontend -n $NAMESPACE
    kubectl rollout status  deployment/contaapp-backend  -n $NAMESPACE
    kubectl rollout status  deployment/contaapp-frontend -n $NAMESPACE
    log_success "Restart completado."
}

delete_deployment() {
    log_warn "Esto elimina todos los recursos de $NAMESPACE"
    read -p "¿Seguro? (y/N) " -n 1 -r; echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete -f "$SCRIPT_DIR/k8s" --ignore-not-found || true
        kubectl delete namespace $NAMESPACE --ignore-not-found || true
        log_success "Recursos eliminados."
    else
        log_info "Cancelado."
    fi
}

show_help() {
    echo ""
    echo "ContaApp — k3s Deployment  |  MK Studios"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "  build     Construye imágenes Docker e importa a k3s"
    echo "  deploy    Aplica los manifests k8s"
    echo "  all       Build + crear DB + deploy (primer deploy)"
    echo "  seed      Ejecuta seed de datos iniciales"
    echo "  update    Actualiza imagen con la versión de versions.env"
    echo "  argocd    Registra la app en ArgoCD (GitOps automático)"
    echo "  status    Muestra pods, services, ingress"
    echo "  logs      Logs del backend (logs frontend para el front)"
    echo "  restart   Reinicia deployments"
    echo "  delete    Elimina todos los recursos"
    echo ""
    echo "Primer deploy:"
    echo "  1. Editar k8s/secret.yaml con secretos reales"
    echo "  2. ./deploy.sh all"
    echo "  3. ./deploy.sh seed"
    echo ""
    echo "Actualización:"
    echo "  1. Editar versions.env  (ej: BACKEND_VERSION=1.0.2)"
    echo "  2. ./deploy.sh build"
    echo "  3. ./deploy.sh update"
    echo ""
    echo "URL: $PRODUCTION_URL"
    echo ""
}

case "${1:-help}" in
    build)   build_images       ;;
    deploy)  deploy_k8s         ;;
    all)     build_images; create_database; deploy_k8s ;;
    seed)    run_seed            ;;
    update)  update_image        ;;
    argocd)  setup_argocd        ;;
    status)  show_status         ;;
    logs)    show_logs "$@"      ;;
    restart) restart_deployment  ;;
    delete)  delete_deployment   ;;
    help|*)  show_help           ;;
esac
