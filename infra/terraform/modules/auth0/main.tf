terraform {
  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = ">= 1.0"
    }
  }
}

resource "auth0_client" "crm" {
  name                = var.app_name
  app_type            = "regular_web"
  callbacks           = var.callback_urls
  allowed_logout_urls = var.logout_urls
  web_origins         = var.web_origins
  oidc_conformant     = true
  grant_types         = ["authorization_code", "refresh_token"]
  jwt_configuration {
    lifetime_in_seconds = 900
  }
  refresh_token {
    rotation_type   = "rotating"
    expiration_type = "expiring"
    leeway          = 0
    token_lifetime  = 28800
  }
}

resource "auth0_resource_server" "api" {
  name       = "P7VC CRM API"
  identifier = var.api_identifier
  signing_alg = "RS256"
  token_lifetime = 900
}

resource "auth0_action" "token_enrichment" {
  name    = "P7VC Token Enrichment"
  runtime = "node18"
  deploy  = true
  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
  code = file("${path.module}/../../auth0/actions/token-enrichment.js")
}

resource "auth0_trigger_actions" "post_login" {
  trigger = "post-login"
  actions {
    id           = auth0_action.token_enrichment.id
    display_name = auth0_action.token_enrichment.name
  }
}

output "client_id" {
  value = auth0_client.crm.client_id
}

output "api_identifier" {
  value = auth0_resource_server.api.identifier
}
