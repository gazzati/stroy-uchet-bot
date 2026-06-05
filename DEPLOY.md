# Deploy with Docker Compose

Production deploy follows the same model as `gazzati/fidar-vpn`.

## Flow

1. GitHub Actions runs CI.
2. After successful CI on `master`, GitHub Actions builds a Docker image.
3. The image is pushed to Docker Hub with tags:
   - `gazzati/stroy-uchet-bot:sha-<commit>`
   - `gazzati/stroy-uchet-bot:latest`
4. Deploy job connects to VPS over SSH.
5. Deploy job writes `.env.deploy` with the current `IMAGE_TAG`.
6. Existing container logs are archived to `logs/archive`.
7. `docker compose` pulls and recreates services.

## VPS Layout

Runtime directory:

```text
/home/stroy-uchet-bot/
  docker-compose.yml
  .env
  .env.deploy
  logs/
    archive/
```

The VPS runtime directory does not need a git checkout.

## Required Files on VPS

- `docker-compose.yml`
- `.env`

## Required GitHub Secrets

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`

## Logs

Current logs:

```bash
cd /home/stroy-uchet-bot
docker compose --env-file .env --env-file .env.deploy logs -f stroy-uchet-bot
```

Archived logs:

```bash
cd /home/stroy-uchet-bot
ls -lah logs/archive
tail -n 200 logs/archive/stroy-uchet-bot_<timestamp>.log
```

## Rollback

```bash
cd /home/stroy-uchet-bot
echo "IMAGE_TAG=sha-<old-commit>" > .env.deploy
docker compose --env-file .env --env-file .env.deploy pull stroy-uchet-bot
docker compose --env-file .env --env-file .env.deploy up -d stroy-uchet-bot
```

