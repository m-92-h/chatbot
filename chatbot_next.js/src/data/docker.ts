export interface DockerChunk {
  question: string;
  answer: string;
}

export const data: DockerChunk[] = [
  // Basic concepts
  {
    question: "ما هو Docker وما الفرق بينه وبين الأجهزة الافتراضية (VMs)؟",
    answer:
      "Docker هو منصة مفتوحة المصدر تُستخدم لبناء التطبيقات وتشغيلها داخل حاويات (Containers) معزولة. الفرق الجوهري بينه وبين الأجهزة الافتراضية (VMs) هو أن الحاويات تتشارك نواة نظام التشغيل (Kernel) للمضيف مباشرةً، بينما تحتاج كل VM إلى نظام تشغيل كامل خاص بها. النتيجة: الحاويات أخف وزناً وأسرع بدءاً وتستهلك موارد أقل بكثير.",
  },
  {
    question: "ما هي Docker Image وكيف تختلف عن Docker Container؟",
    answer:
      "Docker Image هي قالب للقراءة فقط (read-only template) يحتوي على التعليمات اللازمة لإنشاء الحاوية، وتشمل: الكود، وقت التشغيل، المكتبات، ومتغيرات البيئة. أما Docker Container فهو النسخة القابلة للتشغيل من تلك الصورة؛ أي أن الصورة هي المخطط (blueprint) والحاوية هي الكيان الحي الذي يعمل فعلياً. يمكن إنشاء عدة حاويات من نفس الصورة.",
  },
  {
    question: "ما هو Dockerfile وما هي أهم التعليمات الموجودة فيه؟",
    answer:
      "Dockerfile هو ملف نصي يحتوي على مجموعة تعليمات يستخدمها Docker لبناء الصورة تلقائياً. أهم التعليمات:\n- FROM: تحديد الصورة الأساسية\n- WORKDIR: تحديد مجلد العمل داخل الحاوية\n- COPY / ADD: نسخ الملفات\n- RUN: تنفيذ أوامر أثناء البناء\n- EXPOSE: الإعلان عن البورت\n- ENV: تعريف متغيرات البيئة\n- CMD: تحديد الأمر الافتراضي عند تشغيل الحاوية\n- ENTRYPOINT: تحديد نقطة دخول ثابتة للحاوية",
  },
  {
    question: "ما هو Docker Hub وكيف يُستخدم؟",
    answer:
      "Docker Hub هو السجل (Registry) الافتراضي والرسمي لـ Docker، وهو خدمة سحابية تتيح تخزين الصور ومشاركتها. يمكن من خلاله: سحب (pull) الصور الجاهزة مثل nginx وpostgres وnode، ودفع (push) صورك الخاصة، وإنشاء مستودعات عامة أو خاصة. الاستخدام: `docker pull nginx` لسحب صورة nginx، و`docker push username/myapp` لرفع صورتك.",
  },
  {
    question: "ما هو Docker Compose وما فائدته؟",
    answer:
      "Docker Compose هو أداة تُستخدم لتعريف تطبيقات متعددة الحاويات وتشغيلها من خلال ملف YAML واحد اسمه docker-compose.yml. بدلاً من تشغيل كل حاوية يدوياً عبر أوامر طويلة، تكتب إعدادات جميع الخدمات في ملف واحد ثم تشغلها بأمر واحد: `docker compose up`. مثالي للبيئات التطويرية التي تحتاج تطبيق وقاعدة بيانات وخادم cache في آنٍ واحد.",
  },

  // Basic commands
  {
    question: "ما هي أهم أوامر Docker التي يجب معرفتها يومياً؟",
    answer:
      "أهم أوامر Docker اليومية:\n- `docker build -t myapp .` — بناء صورة من Dockerfile\n- `docker run -p 3000:3000 myapp` — تشغيل حاوية مع تعيين البورت\n- `docker ps` — عرض الحاويات الشغّالة\n- `docker ps -a` — عرض جميع الحاويات (بما فيها المتوقفة)\n- `docker stop <id>` — إيقاف حاوية\n- `docker rm <id>` — حذف حاوية\n- `docker images` — عرض الصور المحلية\n- `docker rmi <image>` — حذف صورة\n- `docker logs <id>` — عرض سجلات حاوية\n- `docker exec -it <id> bash` — الدخول إلى حاوية تعمل",
  },
  {
    question: "كيف أشغّل حاوية Docker في الخلفية (detached mode)؟",
    answer:
      "لتشغيل حاوية في الخلفية استخدم خيار `-d` أو `--detach`:\n```bash\ndocker run -d -p 8080:80 --name mynginx nginx\n```\nهذا يشغّل الحاوية دون أن تُقيّد الطرفية. يمكنك بعدها:\n- `docker logs mynginx` لرؤية السجلات\n- `docker stop mynginx` لإيقافها\n- `docker attach mynginx` للإرفاق بها مجدداً",
  },
  {
    question: "ما الفرق بين أوامر CMD و ENTRYPOINT في Dockerfile؟",
    answer:
      "كلاهما يحدد الأمر الذي يعمل عند تشغيل الحاوية، لكن بسلوك مختلف:\n- **CMD**: يحدد الأمر الافتراضي، ويمكن استبداله بالكامل عند تشغيل `docker run image <command>`.\n- **ENTRYPOINT**: يحدد نقطة دخول ثابتة لا تُستبدل بسهولة، والوسائط التي تمررها مع `docker run` تُضاف إليه.\nالجمع بينهما شائع: ENTRYPOINT يحدد البرنامج وCMD يحدد وسائطه الافتراضية.",
  },
  {
    question: "كيف أنسخ ملفات من وإلى حاوية Docker تعمل؟",
    answer:
      "باستخدام أمر `docker cp`:\n```bash\n# نسخ ملف من المضيف إلى الحاوية\ndocker cp ./config.json mycontainer:/app/config.json\n\n# نسخ ملف من الحاوية إلى المضيف\ndocker cp mycontainer:/app/logs/app.log ./app.log\n```\nلكن في بيئة الإنتاج يُفضّل استخدام Volumes بدلاً من النسخ اليدوي.",
  },
  {
    question: "كيف أعرض معلومات تفصيلية عن حاوية أو صورة Docker؟",
    answer:
      "باستخدام أمر `docker inspect`:\n```bash\ndocker inspect <container_id_or_name>\ndocker inspect <image_name>\n```\nيُخرج معلومات JSON تفصيلية تشمل: الشبكات، المنافذ، المتغيرات البيئية، التحميلات (mounts)، وحالة الحاوية. يمكن فلترة النتيجة:\n```bash\ndocker inspect --format='{{.NetworkSettings.IPAddress}}' mycontainer\n```",
  },

  // Networking
  {
    question: "ما هي أنواع شبكات Docker وما الفرق بينها؟",
    answer:
      "Docker يدعم عدة أنواع من الشبكات:\n- **bridge** (الافتراضي): شبكة خاصة معزولة على المضيف، مناسبة لتواصل الحاويات على نفس الجهاز.\n- **host**: الحاوية تستخدم شبكة المضيف مباشرةً دون عزل، أداء أعلى لكن عزل أقل.\n- **none**: لا يوجد اتصال شبكي، أقصى درجات العزل.\n- **overlay**: لتواصل الحاويات عبر أجهزة متعددة (يستخدم مع Docker Swarm).\n- **macvlan**: تعيين عنوان MAC وهمي للحاوية لتظهر كجهاز فيزيائي على الشبكة.",
  },
  {
    question: "كيف أجعل حاويتين Docker تتواصلان مع بعضهما؟",
    answer:
      "الطريقة الأفضل هي إنشاء شبكة مخصصة (custom bridge network) ووضع الحاويات فيها:\n```bash\n# إنشاء الشبكة\ndocker network create mynetwork\n\n# تشغيل الحاويات في نفس الشبكة\ndocker run -d --name db --network mynetwork postgres\ndocker run -d --name app --network mynetwork myapp\n```\nبعد ذلك يمكن للحاوية `app` التواصل مع `db` باستخدام اسمها مباشرةً كـ hostname. في Docker Compose هذا يحدث تلقائياً.",
  },
  {
    question: "ما الفرق بين port binding وport exposing في Docker؟",
    answer:
      "- **EXPOSE في Dockerfile**: مجرد توثيق يُعلن أن الحاوية تستمع على بورت معين، لا يجعله متاحاً فعلياً من خارج Docker.\n- **Port Binding مع `-p`**: يُعيّن فعلياً بورتاً على المضيف ليُعيد توجيه الطلبات إلى بورت الحاوية.\n```bash\n# تعيين بورت 8080 على المضيف إلى 80 في الحاوية\ndocker run -p 8080:80 nginx\n\n# تعيين عشوائي لبورت المضيف\ndocker run -p 80 nginx\n```",
  },

  // Volumes
  {
    question: "ما هي Docker Volumes ولماذا نستخدمها؟",
    answer:
      "Docker Volumes هي آلية لاستمرارية البيانات (data persistence) بين عمليات إيقاف وتشغيل الحاوية. بدونها، تُفقد جميع البيانات المكتوبة داخل الحاوية عند حذفها. الفائدة:\n- حفظ بيانات قواعد البيانات\n- مشاركة ملفات بين حاويات متعددة\n- أداء أفضل من bind mounts\nإنشاء واستخدام volume:\n```bash\ndocker volume create mydata\ndocker run -v mydata:/var/lib/postgresql/data postgres\n```",
  },
  {
    question: "ما الفرق بين Volumes و Bind Mounts في Docker؟",
    answer:
      "كلاهما يُستخدم لاستمرارية البيانات لكن بطرق مختلفة:\n- **Volumes**: تُدار بواسطة Docker وتُخزّن في مكان محدد على المضيف (`/var/lib/docker/volumes/`). موصى بها للإنتاج لأنها مستقلة عن بنية المضيف.\n- **Bind Mounts**: تُعيّن مجلداً محدداً من المضيف إلى الحاوية مباشرةً. مناسبة للتطوير لأنك ترى تغييرات الكود فوراً.\n```bash\n# Bind mount\ndocker run -v /home/user/app:/app myapp\n\n# Named volume\ndocker run -v myvolume:/app/data myapp\n```",
  },
  {
    question: "كيف أدير Docker Volumes (إنشاء، عرض، حذف)؟",
    answer:
      "أوامر إدارة Volumes:\n```bash\n# إنشاء volume\ndocker volume create myvolume\n\n# عرض جميع volumes\ndocker volume ls\n\n# معلومات تفصيلية\ndocker volume inspect myvolume\n\n# حذف volume\ndocker volume rm myvolume\n\n# حذف volumes غير المستخدمة\ndocker volume prune\n```\nتنبيه: لا يمكن حذف volume مرتبط بحاوية تعمل.",
  },

  // Docker Compose
  {
    question: "كيف أكتب ملف docker-compose.yml لتطبيق Next.js مع PostgreSQL؟",
    answer:
      "```yaml\nversion: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - '3000:3000'\n    environment:\n      DATABASE_URL: postgresql://user:password@db:5432/mydb\n    depends_on:\n      db:\n        condition: service_healthy\n    volumes:\n      - .:/app\n      - /app/node_modules\n\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: password\n      POSTGRES_DB: mydb\n    ports:\n      - '5432:5432'\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n    healthcheck:\n      test: ['CMD-SHELL', 'pg_isready -U user -d mydb']\n      interval: 5s\n      timeout: 5s\n      retries: 5\n\nvolumes:\n  pgdata:\n```",
  },
  {
    question: "ما هي أهم أوامر Docker Compose؟",
    answer:
      "أهم أوامر Docker Compose:\n- `docker compose up` — تشغيل جميع الخدمات\n- `docker compose up -d` — تشغيل في الخلفية\n- `docker compose down` — إيقاف وحذف الحاويات والشبكات\n- `docker compose down -v` — إيقاف مع حذف الـ volumes\n- `docker compose ps` — عرض حالة الخدمات\n- `docker compose logs -f` — عرض السجلات بشكل مباشر\n- `docker compose logs -f app` — سجلات خدمة محددة\n- `docker compose build` — إعادة بناء الصور\n- `docker compose exec app bash` — الدخول إلى حاوية خدمة\n- `docker compose restart app` — إعادة تشغيل خدمة",
  },
  {
    question: "ما هو خيار depends_on في Docker Compose وهل يضمن جاهزية الخدمة؟",
    answer:
      "`depends_on` يُحدد ترتيب بدء تشغيل الخدمات، لكنه بشكله البسيط لا يضمن أن الخدمة جاهزة تماماً للاتصال، بل فقط أنها بدأت. للتأكد من الجاهزية استخدم `condition: service_healthy` مع healthcheck:\n```yaml\ndepends_on:\n  db:\n    condition: service_healthy\n```\nهذا ينتظر حتى يُعلن healthcheck أن قاعدة البيانات جاهزة قبل بدء تشغيل التطبيق.",
  },
  {
    question: "كيف أُمرر متغيرات البيئة في Docker Compose؟",
    answer:
      "ثلاث طرق لتمرير متغيرات البيئة:\n1. **مباشرةً في الملف**:\n```yaml\nenvironment:\n  NODE_ENV: production\n  PORT: 3000\n```\n2. **من ملف .env**:\n```yaml\nenv_file:\n  - .env\n```\n3. **مزيج من المصدرين** (الأكثر شيوعاً):\n```yaml\nenvironment:\n  DATABASE_URL: ${DATABASE_URL}\n```\nثم في ملف `.env` في نفس مجلد Compose:\n```\nDATABASE_URL=postgresql://user:pass@db:5432/mydb\n```",
  },

  // Dockerfile
  {
    question: "ما هو Multi-stage Build في Docker ولماذا هو مهم؟",
    answer:
      'Multi-stage Build يسمح بكتابة مراحل بناء متعددة في Dockerfile واحد، ونسخ الملفات المهمة فقط إلى المرحلة النهائية. الفائدة: صور نهائية أصغر بكثير.\nمثال لـ Next.js:\n```dockerfile\n# مرحلة البناء\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# مرحلة الإنتاج\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/.next/standalone ./\nCOPY --from=builder /app/.next/static ./.next/static\nCOPY --from=builder /app/public ./public\nCMD ["node", "server.js"]\n```\nالصورة النهائية لا تحتوي على node_modules الكاملة أو كود المصدر.',
  },
  {
    question: "كيف أُحسّن Docker image لتطبيق Node.js من ناحية الحجم والأمان؟",
    answer:
      "أفضل الممارسات لتحسين صورة Node.js:\n1. **استخدم alpine**: `FROM node:20-alpine` بدلاً من `node:20`\n2. **Multi-stage build** لاستبعاد devDependencies من الإنتاج\n3. **استخدم .dockerignore** لاستبعاد `node_modules`, `.git`, `.env`\n4. **ترتيب الطبقات** — COPY package.json قبل COPY . لاستفادة من الـ cache:\n```dockerfile\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\n```\n5. **تشغيل كمستخدم غير root**:\n```dockerfile\nRUN addgroup -S appgroup && adduser -S appuser -G appgroup\nUSER appuser\n```",
  },
  {
    question: "ما هو .dockerignore وما الملفات التي يجب إضافتها إليه؟",
    answer:
      "`.dockerignore` يعمل مثل `.gitignore` تماماً لكن لـ Docker، يُخبره بتجاهل ملفات معينة عند نسخها إلى الصورة أثناء البناء. محتوى نموذجي:\n```\nnode_modules\n.git\n.gitignore\n.env\n.env.local\n.env.*.local\nnpm-debug.log*\n.DS_Store\ndist\nbuild\n.next\n*.md\nDockerfile\ndocker-compose*.yml\n```\nبدونه سيُنسخ `node_modules` إلى الصورة مما يُبطّئ البناء ويُضخّمها.",
  },
  {
    question: "ما الفرق بين RUN و CMD و ENTRYPOINT في Dockerfile؟",
    answer:
      '- **RUN**: يُنفَّذ أثناء **بناء الصورة** ونتيجته تُخزَّن كطبقة جديدة. مثال: `RUN npm install`\n- **CMD**: يُحدد الأمر الافتراضي الذي يعمل **عند تشغيل الحاوية**. يمكن استبداله بتمرير أمر مختلف مع `docker run`.\n- **ENTRYPOINT**: نقطة دخول ثابتة تعمل **عند تشغيل الحاوية**، الوسائط المُمررة تُضاف إليه بدل استبداله.\n\nمثال جمعهما:\n```dockerfile\nENTRYPOINT ["node"]\nCMD ["server.js"]\n# يُنفِّذ: node server.js\n# يمكن تجاوزه: docker run myapp app.js → node app.js\n```',
  },

  // Safety and production
  {
    question: "كيف أتعامل مع secrets والبيانات الحساسة في Docker؟",
    answer:
      "لا تضع البيانات الحساسة مباشرةً في Dockerfile أو docker-compose.yml. البدائل:\n1. **Docker Secrets** (مع Docker Swarm):\n```bash\necho 'mypassword' | docker secret create db_password -\n```\n2. **متغيرات البيئة من ملف .env** (مع إضافته إلى .gitignore).\n3. **أدوات إدارة الأسرار** مثل HashiCorp Vault أو AWS Secrets Manager في الإنتاج.\n4. **Build arguments** فقط للبناء (ليس للتشغيل):\n```dockerfile\nARG API_KEY\nRUN curl -H \"Authorization: ${API_KEY}\" ...\n```\nتحذير: ARG يظهر في تاريخ الطبقات — لا تستخدمه للأسرار الدائمة.",
  },
  {
    question: "ما هو Docker healthcheck وكيف أضيفه؟",
    answer:
      'Healthcheck هو أمر يُشغّله Docker دورياً للتحقق من أن الحاوية تعمل بشكل صحيح. يمكن تعريفه في Dockerfile:\n```dockerfile\nHEALTHCHECK --interval=30s --timeout=10s --retries=3 \\\n  CMD curl -f http://localhost:3000/health || exit 1\n```\nأو في docker-compose.yml:\n```yaml\nhealthcheck:\n  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]\n  interval: 30s\n  timeout: 10s\n  retries: 3\n  start_period: 40s\n```\nالحالات الممكنة: `healthy`, `unhealthy`, `starting`.',
  },
  {
    question: "ما هو Docker Layer Caching وكيف أستغله لتسريع البناء؟",
    answer:
      "Docker يحفظ كل طبقة (layer) من Dockerfile في الـ cache. عند إعادة البناء يُعيد استخدام الطبقات التي لم تتغير. لاستغلاله:\n1. **ضع الأشياء الأبطأ تغيراً أولاً**:\n```dockerfile\n# ✅ صحيح: package.json لا يتغير كثيراً\nCOPY package*.json ./\nRUN npm ci\n# الكود يتغير دائماً - يأتي لاحقاً\nCOPY . .\n```\n2. **اجمع أوامر RUN** لتقليل الطبقات:\n```dockerfile\n# ✅\nRUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*\n```\n3. **استخدم `--cache-from`** في CI/CD لمشاركة الـ cache.",
  },
  {
    question: "كيف أُشغّل Docker بدون صلاحيات root (rootless Docker)؟",
    answer:
      "Rootless Docker يُشغّل Docker daemon وحاوياته كمستخدم عادي بدون root، مما يقلل خطر الثغرات الأمنية.\nالتثبيت:\n```bash\ncurl -fsSL https://get.docker.com/rootless | sh\nexport PATH=/home/$USER/bin:$PATH\nexport DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock\n```\nداخل Dockerfile يمكن تشغيل التطبيق كمستخدم غير root:\n```dockerfile\nRUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser\nUSER appuser\n```",
  },

  // Docker Registry
  {
    question: "كيف أرفع صورة Docker إلى Docker Hub؟",
    answer:
      "خطوات رفع صورة إلى Docker Hub:\n```bash\n# 1. تسجيل الدخول\ndocker login\n\n# 2. بناء الصورة مع tag مناسب\ndocker build -t username/myapp:v1.0 .\n\n# 3. أو إضافة tag لصورة موجودة\ndocker tag myapp username/myapp:v1.0\n\n# 4. رفع الصورة\ndocker push username/myapp:v1.0\n\n# 5. رفع بجميع الـ tags\ndocker push username/myapp --all-tags\n```\nيمكن بعدها سحبها من أي مكان: `docker pull username/myapp:v1.0`",
  },
  {
    question: "كيف أُنشئ Docker Registry خاصاً (Private Registry)؟",
    answer:
      "يمكن تشغيل registry خاص باستخدام الصورة الرسمية:\n```bash\ndocker run -d -p 5000:5000 --name registry \\\n  -v registry-data:/var/lib/registry \\\n  registry:2\n```\nثم استخدامه:\n```bash\n# بناء ورفع\ndocker build -t localhost:5000/myapp .\ndocker push localhost:5000/myapp\n\n# سحب\ndocker pull localhost:5000/myapp\n```\nللإنتاج يُنصح بإضافة TLS وAuthentication وبدائل مثل Harbor أو GitLab Container Registry.",
  },

  // Performance and monitoring
  {
    question: "كيف أراقب استهلاك موارد حاويات Docker؟",
    answer:
      "Docker يوفر أوامر مراقبة مدمجة:\n```bash\n# مراقبة فورية لجميع الحاويات\ndocker stats\n\n# مراقبة حاويات محددة\ndocker stats myapp db\n\n# لقطة واحدة بدون تحديث مستمر\ndocker stats --no-stream\n\n# معلومات تفصيلية\ndocker inspect <container> | grep -i memory\n```\nللمراقبة المتقدمة يمكن استخدام:\n- **cAdvisor**: مراقبة حاويات مع واجهة ويب\n- **Prometheus + Grafana**: مراقبة وبيانات بيانية\n- **Docker Desktop**: واجهة بصرية مدمجة",
  },
  {
    question: "كيف أُحدد حدوداً لموارد الحاوية (CPU وMemory)؟",
    answer:
      "تحديد حدود الموارد يمنع الحاوية من التأثير على بقية النظام:\n```bash\n# تحديد الذاكرة والـ CPU\ndocker run -m 512m --cpus=1.5 myapp\n```\nفي docker-compose.yml:\n```yaml\nservices:\n  app:\n    image: myapp\n    deploy:\n      resources:\n        limits:\n          cpus: '1.5'\n          memory: 512M\n        reservations:\n          cpus: '0.5'\n          memory: 256M\n```\n`limits` الحد الأقصى، `reservations` الموارد المحجوزة دائماً.",
  },
  {
    question: "كيف أُنظّف Docker من الموارد غير المستخدمة؟",
    answer:
      "مع الوقت تتراكم صور وحاويات وشبكات وvolumes غير مستخدمة. أوامر التنظيف:\n```bash\n# تنظيف شامل (الأكثر استخداماً)\ndocker system prune\n\n# تنظيف شامل مع volumes\ndocker system prune -a --volumes\n\n# تنظيف محدد\ndocker container prune  # حاويات متوقفة\ndocker image prune -a   # صور غير مستخدمة\ndocker volume prune     # volumes غير مرتبطة\ndocker network prune    # شبكات غير مستخدمة\n\n# عرض استهلاك المساحة\ndocker system df\n```",
  },

  // Docker with development tools
  {
    question: "كيف أستخدم Docker مع Node.js وأرى تغييرات الكود فوراً (Hot Reload)؟",
    answer:
      'لتفعيل Hot Reload في بيئة Docker التطويرية:\n```yaml\n# docker-compose.dev.yml\nservices:\n  app:\n    build:\n      context: .\n      target: development\n    volumes:\n      - .:/app\n      - /app/node_modules\n    command: npm run dev\n    environment:\n      NODE_ENV: development\n```\nفي Dockerfile:\n```dockerfile\nFROM node:20-alpine AS development\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nCMD ["npm", "run", "dev"]\n```\nالـ volume `.:/app` يعكس الكود المحلي داخل الحاوية فوراً.',
  },
  {
    question: "كيف أُشغّل PostgreSQL مع pgvector extension في Docker؟",
    answer:
      "لتشغيل PostgreSQL مع pgvector لتطبيقات AI/RAG:\n```yaml\nservices:\n  db:\n    image: pgvector/pgvector:pg16\n    environment:\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: password\n      POSTGRES_DB: mydb\n    ports:\n      - '5432:5432'\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n      - ./init.sql:/docker-entrypoint-initdb.d/init.sql\n    healthcheck:\n      test: ['CMD-SHELL', 'pg_isready -U user -d mydb']\n      interval: 5s\n      retries: 5\n\nvolumes:\n  pgdata:\n```\nفي ملف `init.sql`:\n```sql\nCREATE EXTENSION IF NOT EXISTS vector;\n```",
  },
  {
    question: "كيف أُشغّل Redis في Docker للـ caching؟",
    answer:
      "```yaml\nservices:\n  redis:\n    image: redis:7-alpine\n    ports:\n      - '6379:6379'\n    volumes:\n      - redis-data:/data\n    command: redis-server --appendonly yes --requirepass mypassword\n    healthcheck:\n      test: ['CMD', 'redis-cli', '-a', 'mypassword', 'ping']\n      interval: 10s\n      timeout: 5s\n      retries: 5\n\nvolumes:\n  redis-data:\n```\n`--appendonly yes` يحفظ البيانات على القرص. للوصول:\n```bash\ndocker exec -it redis redis-cli -a mypassword\n```",
  },
  {
    question: "كيف أربط Docker مع Nginx كـ reverse proxy؟",
    answer:
      "```yaml\nservices:\n  nginx:\n    image: nginx:alpine\n    ports:\n      - '80:80'\n      - '443:443'\n    volumes:\n      - ./nginx.conf:/etc/nginx/nginx.conf:ro\n      - ./ssl:/etc/nginx/ssl:ro\n    depends_on:\n      - app\n\n  app:\n    build: .\n    expose:\n      - '3000'\n```\nملف `nginx.conf`:\n```nginx\nupstream app {\n  server app:3000;\n}\nserver {\n  listen 80;\n  location / {\n    proxy_pass http://app;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n  }\n}\n```",
  },

  // Docker in CI/CD
  {
    question: "كيف أستخدم Docker في GitHub Actions للـ CI/CD؟",
    answer:
      "```yaml\n# .github/workflows/deploy.yml\nname: Build and Deploy\non:\n  push:\n    branches: [main]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n\n      - name: Login to Docker Hub\n        uses: docker/login-action@v3\n        with:\n          username: ${{ secrets.DOCKER_USERNAME }}\n          password: ${{ secrets.DOCKER_TOKEN }}\n\n      - name: Build and push\n        uses: docker/build-push-action@v5\n        with:\n          context: .\n          push: true\n          tags: username/myapp:${{ github.sha }}\n          cache-from: type=gha\n          cache-to: type=gha,mode=max\n```",
  },
  {
    question: "ما هو Docker Swarm وكيف يختلف عن Kubernetes؟",
    answer:
      "Docker Swarm هو نظام orchestration مدمج في Docker لإدارة مجموعة من الحاويات عبر عدة خوادم.\n\n**المقارنة مع Kubernetes:**\n| الجانب | Docker Swarm | Kubernetes |\n|---|---|---|\n| التعقيد | بسيط | معقد |\n| الإعداد | سريع جداً | يحتاج وقتاً |\n| المميزات | أساسية | شاملة جداً |\n| المجتمع | أصغر | أكبر وأنشط |\n| الاستخدام | مشاريع متوسطة | إنتاج واسع النطاق |\n\nللمشاريع الصغيرة والمتوسطة Swarm كافٍ، للإنتاج الكبير Kubernetes هو المعيار.",
  },
  {
    question: "ما هو الفرق بين docker run وdocker create وdocker start؟",
    answer:
      "- `docker create`: يُنشئ الحاوية فقط دون تشغيلها، يُعيد Container ID.\n- `docker start <id>`: يُشغّل حاوية موجودة ومتوقفة.\n- `docker run`: يجمع الثلاثة (pull إن لم تكن الصورة موجودة + create + start) في أمر واحد.\n\n```bash\n# هذا الأمر:\ndocker run nginx\n\n# يعادل:\ndocker pull nginx  # إن لم تكن موجودة\ndocker create nginx\ndocker start <container_id>\n```\n`docker run` هو الأمر الأكثر استخداماً في معظم الحالات.",
  },
];

export default data;
