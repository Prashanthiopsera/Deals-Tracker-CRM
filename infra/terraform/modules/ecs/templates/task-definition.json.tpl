[
  {
    "name": "${container_name}",
    "image": "${container_image}",
    "essential": true,
    "portMappings": [
      {
        "containerPort": ${app_port},
        "hostPort": ${app_port},
        "protocol": "tcp"
      }
    ],
    "environment": [
      { "name": "NODE_ENV", "value": "${environment}" },
      { "name": "PORT", "value": "${app_port}" },
      { "name": "AWS_REGION", "value": "${aws_region}" },
      { "name": "AUTH0_DOMAIN", "value": "${auth0_domain}" },
      { "name": "AUTH0_AUDIENCE", "value": "${auth0_audience}" }
    ],
    "secrets": ${secrets_json},
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${log_group}",
        "awslogs-region": "${aws_region}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "wget -qO- http://localhost:${app_port}${health_check_path} || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 60
    }
  }
]
