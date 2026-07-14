variable "auth0_domain" {
  type = string
}

variable "app_name" {
  type    = string
  default = "P7VC CRM"
}

variable "callback_urls" {
  type = list(string)
}

variable "logout_urls" {
  type = list(string)
}

variable "web_origins" {
  type = list(string)
}

variable "api_identifier" {
  type = string
}
