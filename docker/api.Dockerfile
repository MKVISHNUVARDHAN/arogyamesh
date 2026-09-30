FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api apps/api
COPY services services
COPY scripts scripts
RUN mkdir -p data/synthetic && useradd -m app && chown -R app:app /app
USER app
EXPOSE 8100
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8100", "--workers", "1"]
