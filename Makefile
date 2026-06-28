.PHONY: deploy logs restart down

# คำสั่งสำหรับ Build และ Deploy Container ใหม่ (สำหรับ Production)
deploy:
	@echo "🚀 กำลัง Build และ Deploy jeval-app ใหม่..."
	docker compose -f docker-compose.prod.yml up -d --build jeval-app
	@echo "✅ Deploy เสร็จสิ้น!"

# คำสั่งดู Logs
logs:
	docker compose -f docker-compose.prod.yml logs -f jeval-app

# คำสั่ง Restart Container โดยไม่ Build ใหม่
restart:
	docker compose -f docker-compose.prod.yml restart jeval-app

# คำสั่ง Stop Container
down:
	docker compose -f docker-compose.prod.yml down
