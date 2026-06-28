.PHONY: deploy push logs restart down

# คำสั่งสำหรับ Build และ Deploy Container ใหม่ (สำหรับ Production)
deploy: push
	@echo "🚀 กำลัง Build และ Deploy jeval-app ใหม่..."
	docker compose -f docker-compose.prod.yml up -d --build jeval-app
	@echo "✅ Deploy เสร็จสิ้น!"

# คำสั่งสำหรับ Commit และ Push โค้ด
push:
	@echo "=> Committing and pushing to GitHub..."
	git add .
	git commit -m "chore: auto-deploy update" || true
	GIT_SSH_COMMAND="ssh -i ~/.ssh/jeval_gh_auth_id_ed25519" git push -u origin main
	@echo "=> Git push completed."

# คำสั่งดู Logs
logs:
	docker compose -f docker-compose.prod.yml logs -f jeval-app

# คำสั่ง Restart Container โดยไม่ Build ใหม่
restart:
	docker compose -f docker-compose.prod.yml restart jeval-app

# คำสั่ง Stop Container
down:
	docker compose -f docker-compose.prod.yml down
