# lookalike

This project, named `lookalike`, is a full-stack web application built with TypeScript, React, and FastAPI, designed for creating and managing dynamic forms. It leverages real-time collaboration features via Socket.IO, AI-powered form generation, and robust data handling, offering a comprehensive platform for form building and submission.

## ✨ Features

*   **AI-Powered Form Generation:** Automatically generate form schemas based on natural language prompts using Langchain and Groq.
*   **Real-time Collaboration:** Multiple users can edit forms simultaneously with live presence indicators and collaborative editing features powered by Socket.IO.
*   **Drag-and-Drop Form Builder:** An intuitive visual interface for designing forms.
*   **Dynamic Form Display:** Forms can adapt their visibility and fields based on user input and defined logic.
*   **Secure Authentication:** User registration and login with password hashing and JWT authentication.
*   **Response Management:** Collect, view, and export form submissions in CSV format.
*   **Multi-theme Support:** Customizable user interface with light, dark, and aurora themes.
*   **File Uploads:** Integration with Cloudinary for handling file uploads within forms.

## 🚀 Tech Stack

*   **Frontend:** TypeScript, React, Vite, Tailwind CSS, Zustand, React Router DOM, Socket.IO Client, dnd-kit, xyflow
*   **Backend:** Python, FastAPI, SQLAlchemy, Uvicorn, Socket.IO, Pydantic, Langchain, Langgraph, Langchain-Groq, python-socketio
*   **Database:** PostgreSQL (implied by `psycopg2-binary` and `DATABASE_URL` in `.env`)
*   **Deployment:** Netlify (frontend, implied by `netlify.toml`), Render (backend, based on `.env.example` URLs)

## ⚙️ Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Mahi-singh-solanki/lookalike.git
    cd lookalike
    ```

2.  **Backend Setup (Python/FastAPI):**
    *   Install Python dependencies:
        ```bash
        cd backend
        pip install -r requirements.txt
        ```
    *   Set up environment variables:
        Create a `.env` file in the `backend/` directory based on `.env.example`:
        ```dotenv
        # backend/.env
        DATABASE_URL=your_postgres_connection_string
        JWT_SECRET_KEY=your_strong_secret_key
        JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
        # Email verification setup (optional, used for admin invitations)
        EMAIL=your_email@gmail.com
        APP_PASSWORD=your_gmail_app_password
        # Groq API key for AI form generation
        GROQ_API_KEY=your_groq_api_key
        GROQ_MODEL=llama-3.1-8b-instant # or other supported model
        BACKEND_CORS_ORIGINS=http://localhost:5173 # Frontend origin
        ```
    *   Run the backend server:
        ```bash
        cd backend
        uvicorn app.main:app --reload
        ```

3.  **Frontend Setup (React/Vite):**
    *   Install Node.js dependencies:
        ```bash
        cd ../ # Back to the root directory
        npm install
        ```
    *   Set up environment variables:
        Create a `.env` file in the root directory (or `src/` if Vite is configured that way) based on `.env.example`:
        ```dotenv
        # .env
        VITE_API_BASE_URL=http://localhost:8000 # Or your backend URL
        VITE_WS_URL=http://localhost:8000 # Or your backend WebSocket URL
        VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
        VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset
        ```
    *   Run the frontend development server:
        ```bash
        npm run dev
        ```

## 📝 Usage

### Creating Forms

1.  **Manual Creation:** Navigate to the **Builder** page. Use the drag-and-drop interface to add fields, configure their properties (type, label, required, options, visibility rules, etc.). Save the form.
2.  **AI Generation:** Use the chat interface within the builder to describe the form you want. The AI will generate a schema, which you can then refine.

### Submitting Forms

1.  Access a live form via its unique URL (e.g., `/stage/:formId`).
2.  Fill out the form fields as required.
3.  Click **Submit Response**.

### Managing Responses (Vault)

1.  Navigate to the **Vault** page for a specific form.
2.  View all submitted responses.
3.  Search for specific responses.
4.  Export all responses as a CSV file.

### Real-time Collaboration

When multiple users are in the form builder, you will see their avatars and cursors indicating their current activity.

## 📁 Project Structure

```
lookalike/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── hashing.py
│   │   ├── jwt_token.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── oauth2.py
│   │   ├── realtime.py
│   │   ├── repository/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── chatbot.py
│   │   │   ├── email_verify.py
│   │   │   ├── forms.py
│   │   │   └── responses.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   └── forms_responses.py
│   │   └── schemas.py
│   ├── backend/
│   │   └── region-movement.log
│   ├── .env.example
│   ├── netlify.toml
│   ├── requirements.txt
│   └── uvicorn.log
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── AvatarStack.tsx
│   │   │   ├── ConnectionBadge.tsx
│   │   │   ├── GlassPanel.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── ToastHost.tsx
│   │   └── ... (other components)
│   ├── pages/
│   │   ├── AuthPage.tsx
│   │   ├── BuilderPage.tsx
│   │   ├── StagePage.tsx
│   │   └── VaultPage.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── fieldCatalog.ts
│   │   ├── fieldLogic.ts
│   │   └── socket.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── builderStore.ts
│   │   ├── themeStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   └── form.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env
├── .env.example
├── index.html
├── package.json
├── postcss.config.cjs
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🛠️ Dependencies

### Backend (`requirements.txt`)

*   `fastapi[standard]`
*   `uvicorn`
*   `sqlalchemy`
*   `psycopg2-binary`
*   `python-dotenv`
*   `pydantic`
*   `python-multipart`
*   `passlib==1.7.4`
*   `bcrypt==3.2.2`
*   `python-jose`
*   `langchain`
*   `langgraph`
*   `langchain-groq`
*   `python-socketio`

### Frontend (`package.json`)

*   `@dnd-kit/core`
*   `@dnd-kit/sortable`
*   `@xyflow/react`
*   `axios`
*   `clsx`
*   `framer-motion`
*   `lucide-react`
*   `react`
*   `react-dom`
*   `react-router-dom`
*   `socket.io-client`
*   `zustand`
*   `@types/react`
*   `@types/react-dom`
*   `@vitejs/plugin-react`
*   `autoprefixer`
*   `postcss`
*   `tailwindcss`
*   `typescript`
*   `vite`

## 💡 How to Contribute

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature (`git checkout -b feature/your-feature`).
3.  Make your changes and commit them (`git commit -am 'Add new feature'`).
4.  Push to the branch (`git push origin feature/your-feature`).
5.  Create a new Pull Request.

## 📄 License

This project is not specified with a license. Please refer to the repository for details.

## 🔗 Important Links

*   **Repository:** [Mahi-singh-solanki/lookalike](https://github.com/Mahi-singh-solanki/lookalike)

---

> Repository: `lookalike`
> URL: [https://github.com/Mahi-singh-solanki/lookalike](https://github.com/Mahi-singh-solanki/lookalike)
> Author: Mahi Singh Solanki
>
> Fork, Like, and Star this repository if you find it useful!
> Please open an issue for any bugs or feature requests.


---
