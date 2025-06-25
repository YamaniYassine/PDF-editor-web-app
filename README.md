# PDF-editor-web-app
PDF editor web app

# runing front-end 
cd pdf-editor-frontend
npm run dev 

# runing back-end
cd pdf-editor-backend
source venv/bin/activate
uvicorn main:app --reload --port 8000



# if needed
For Ubuntu/Debian:  sudo apt-get update && sudo apt-get install -y qpdf
For Docker (inside Dockerfile): RUN apt-get update && apt-get install -y qpdf