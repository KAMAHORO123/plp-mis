# Deploying PLP on the netcup server

This guide puts the public website and the PLP Hub on one netcup server, running as Docker containers with automatic HTTPS. It also moves the real accounts and their data from your computer to the server. The demo accounts (`@plp-demo.test`) are left behind.

It takes about an hour. Commands in **On your Mac** blocks run in Terminal on your computer, from the project folder. Commands in **On the server** blocks run after you have connected with `ssh`.

## What you need first

- The server's IP address and root password (in the netcup Customer Control Panel / SCP).
- Your domain name and access to its DNS settings.
- Two addresses for PLP, for example `peaceloveproclaimers.org` for the public website and `hub.peaceloveproclaimers.org` for the Hub.
- An SMTP account for sending email (verification codes, password resets, application emails). For example, use a Google Workspace SMTP relay, Brevo, Mailgun or your email host's SMTP.

## 1. Point your domain at the server

At your domain provider, create two **A records**, both pointing to the server's IPv4 address:

| Name | Type | Value |
|---|---|---|
| `@` (the website) | A | `YOUR_SERVER_IP` |
| `hub` | A | `YOUR_SERVER_IP` |

If netcup also gave you an IPv6 address, add matching **AAAA** records. DNS can take a few minutes to an hour to update. Check with `ping hub.your-domain`.

## 2. Log in to the server with a key instead of a password

**On your Mac:**

```sh
ls ~/.ssh/id_ed25519.pub || ssh-keygen -t ed25519
ssh-copy-id root@YOUR_SERVER_IP
ssh root@YOUR_SERVER_IP
```

If netcup installed Debian or Ubuntu, continue below. Otherwise, reinstall the server with **Debian 12** or **Ubuntu 24.04** from the netcup panel first.

## 3. Prepare the server

**On the server:**

```sh
apt update && apt -y upgrade
apt -y install git ufw unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

# Firewall: SSH and the web only.
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
ufw --force enable

# Docker
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

After you confirm that key login works, turn off password logins for SSH. On the server, edit `/etc/ssh/sshd_config` and set `PasswordAuthentication no`, then run `systemctl restart ssh`.

## 4. Download the code

**On the server:**

```sh
git clone https://github.com/KAMAHORO123/plp-mis.git /opt/plp
mkdir -p /opt/plp/deploy/export
cd /opt/plp/deploy
```

If the repository is private, GitHub asks for a username and password. For the password, use a **personal access token** with read access to the repository (GitHub → Settings → Developer settings → Fine-grained tokens).

## 5. Fill in the settings file

**On the server:**

```sh
cp .env.example .env
chmod 600 .env
# Print fresh random secrets to paste into the file:
echo "DB_PASSWORD=$(openssl rand -hex 32)"
echo "APP_DB_PASSWORD=$(openssl rand -hex 32)"
echo "JWT_SECRET=$(openssl rand -base64 48)"
nano .env
```

Set at least:

| Setting | Example |
|---|---|
| `DB_PASSWORD`, `APP_DB_PASSWORD`, `JWT_SECRET` | the values printed above |
| `SITE_HOST` | `peaceloveproclaimers.org` (no `https://`) |
| `HUB_HOST` | `hub.peaceloveproclaimers.org` |
| `TLS_EMAIL` | an address that receives certificate expiry notices |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | from your email provider |
| `MAIL_FROM` | `PLP <no-reply@peaceloveproclaimers.org>` |

Save with `Ctrl+O`, `Enter`, `Ctrl+X`. **Never commit or share this file.** It is ignored by Git.

**Google sign-in is optional.** To use it, open Google Cloud Console → APIs & Services → Credentials, and add `https://hub.your-domain/api/auth/google/callback` as an authorised redirect URI. Then fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Leave both empty to turn Google sign-in off.

## 6. Export the real data from your Mac

The local Docker stack must be running (`docker compose up -d`).

**On your Mac:**

```sh
./deploy/export-local-data.sh
scp deploy/export/plp.sql deploy/export/uploads.tar.gz root@YOUR_SERVER_IP:/opt/plp/deploy/export/
```

The script copies your local database into a scratch database and runs `deploy/remove-demo-data.sql` on the copy. It then writes the cleaned database and the uploaded files that real accounts still use. Your local database is not changed.

The cleanup removes:

- the `@plp-demo.test` accounts and everything they created: demo courses, opportunities, activities, register members, certificates, meetings, mentor sessions and uploads
- schools that no real account uses

Real accounts keep everything they created. Enrolments, certificates and applications that belonged to demo courses or opportunities are removed with them.

## 7. Import the data and start everything

**On the server:**

```sh
cd /opt/plp/deploy
./import-data.sh
docker compose --env-file .env -f compose.yml --profile mail up -d --build
docker compose --env-file .env -f compose.yml ps
```

The first build takes 5–10 minutes. Every service should show `running` or `healthy`, and `migrate` should show `exited (0)`. Caddy requests the HTTPS certificates automatically the first time someone visits each address.

After the import, delete the export files from the server and from your Mac. They contain personal data:

```sh
rm -rf /opt/plp/deploy/export        # on the server
rm -rf deploy/export                 # on your Mac
```

## 8. Check it works

1. Open `https://your-domain` and `https://hub.your-domain`. Both should load with a padlock.
2. Sign in to the Hub with one of the real accounts. Passwords are the same as on your computer.
3. Test email: use "Forgot password" on an account whose inbox you can read. You can also check the SMTP connection without sending anything:
   ```sh
   docker compose --env-file .env -f compose.yml exec platform npm run mail:check
   ```
4. If something fails, read the logs:
   ```sh
   docker compose --env-file .env -f compose.yml logs --tail 100 platform gateway mail
   ```

## 9. Turn on daily backups

**On the server:**

```sh
crontab -e
```

Add this line to back up every night at 02:30 server time:

```
30 2 * * * cd /opt/plp/deploy && ./backup.sh >> backups/backup.log 2>&1
```

Each backup writes a database dump and an archive of the uploaded files to `/opt/plp/deploy/backups/`. Copy them off the server regularly, because a backup on the same machine doesn't protect against losing the server. netcup's own snapshots (in the SCP) are a good extra layer. To prove a backup can be restored, run `./restore-test.sh backups/plp-….dump`. It restores into a new database and never touches the live one.

## Updating the site later

After new changes are pushed to GitHub:

**On the server:**

```sh
cd /opt/plp && git pull
cd deploy && docker compose --env-file .env -f compose.yml --profile mail up -d --build
```

Database migrations run automatically on start. Run `./backup.sh` first if the update is large.

## Useful commands

All of these run from `/opt/plp/deploy` on the server.

| Task | Command |
|---|---|
| Status | `docker compose --env-file .env -f compose.yml ps` |
| Live logs | `docker compose --env-file .env -f compose.yml logs -f platform` |
| Restart one service | `docker compose --env-file .env -f compose.yml restart platform` |
| Stop everything (data is kept) | `docker compose --env-file .env -f compose.yml --profile mail down` |
| Free disk space from old images | `docker image prune -f` |

Never run `down -v`. The `-v` flag deletes the database and uploads volumes.
