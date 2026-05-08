#!/bin/bash

# DSU-V4 CLI Manager
# Script de lancement facile pour le projet

# Fonction pour vérifier et démarrer MongoDB
check_mongodb() {
    echo "🔍 Vérification du service MongoDB..."

    # Vérifie si systemd gère mongod
    if systemctl list-unit-files | grep -q "mongod.service"; then
        if ! systemctl is-active --quiet mongod; then
            echo "⚠️ MongoDB est arrêté. Tentative de démarrage (mot de passe sudo peut être requis)..."
            sudo systemctl start mongod
            if [ $? -eq 0 ]; then
                echo "✅ MongoDB démarré avec succès."
            else
                echo "❌ Échec du démarrage de MongoDB."
                exit 1
            fi
        else
            echo "✅ MongoDB est déjà en cours d'exécution."
        fi
    else
        echo "⚠️ Service mongod non trouvé via systemctl. Assurez-vous que la base de données est accessible."
    fi
}

show_help() {
    echo "========================================="
    echo "🤖 DSU-V4 CLI"
    echo "========================================="
    echo "Utilisation: ./dsu.sh [commande] [options]"
    echo ""
    echo "Commandes disponibles:"
    echo "  prod      Lancement normal (Production). Vérifie MongoDB et lance 'npm run start'"
    echo "  dev       Lancement en mode développement. Vérifie MongoDB et lance 'npm run dev'"
    echo "  mockui    Lancement mode Test UI (Aucune DB ni bot requis). Lance 'npm run test:ui'"
    echo ""
    echo "Options:"
    echo "  -nowebui  Désactive l'interface web pour les modes prod et dev"
    echo "========================================="
}

COMMAND=$1
SHIFT_COUNT=1

case "$COMMAND" in
    prod|dev)
        check_mongodb
        export DISABLE_WEB=false

        # Vérification des options supplémentaires
        for arg in "${@:2}"; do
            if [ "$arg" == "-nowebui" ]; then
                echo "🌐 Interface Web : DÉSACTIVÉE"
                export DISABLE_WEB=true
            fi
        done

        if [ "$COMMAND" == "prod" ]; then
            echo "🚀 Lancement de DSU-V4 en mode PRODUCTION..."
            npm run start
        else
            echo "🛠️ Lancement de DSU-V4 en mode DÉVELOPPEMENT..."
            npm run dev
        fi
        ;;
    mockui)
        echo "🌐 Lancement exclusif de l'Interface Web de test..."
        echo "Utilisateur : admin / Mot de passe : password"
        # Pas de vérification MongoDB requise car le mode test-ui.js bypass la DB
        npm run test:ui
        ;;
    *)
        show_help
        exit 1
        ;;
esac
