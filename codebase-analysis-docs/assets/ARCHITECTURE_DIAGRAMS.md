# HostelHub — Architecture Diagrams

> Supplemental diagrams for `CODEBASE_KNOWLEDGE.md`. All diagrams are in Mermaid format.

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        UI[React Pages & Components]
        Router[React Router v7]
        AuthCtx[AuthContext]
        ApiHook[useApi Hook]
        AuthSvc[auth.service.ts]
    end

    subgraph "Backend (Express + TypeScript)"
        Server[server.ts]
        MW[Middleware Stack]
        Controllers[15 Controllers]
        Services[5 Menu Services]
        Models[10 Mongoose Models]
    end

    subgraph "External"
        MongoDB[(MongoDB)]
        Gemini[Google Gemini AI]
        LPSolver[javascript-lp-solver]
    end

    UI --> Router
    Router --> AuthCtx
    AuthCtx --> AuthSvc
    UI --> ApiHook
    ApiHook -->|HTTP/REST| Server

    Server --> MW
    MW --> Controllers
    Controllers --> Services
    Controllers --> Models
    Services --> Models
    Services --> LPSolver
    Services --> Gemini
    Models --> MongoDB
```

---

## 2. Middleware Pipeline

```mermaid
graph LR
    REQ[Incoming Request] --> Helmet
    Helmet --> CORS
    CORS --> JSON[express.json]
    JSON --> VT{verifyToken}
    VT -->|Invalid| R401[401 Unauthorized]
    VT -->|Valid| RR{requireRole}
    RR -->|Wrong Role| R403a[403 Forbidden]
    RR -->|Correct Role| RP{requirePermission}
    RP -->|DB Lookup: isPrimaryAdmin?| BYPASS[Bypass → Controller]
    RP -->|Has Permission| ALLOW[Allow → Controller]
    RP -->|Missing Permission| R403b[403 Forbidden]
```

---

## 3. Menu Generation Pipeline

```mermaid
flowchart TD
    A[Admin clicks Generate] -->|POST /admin/menu/generate| B[Delete existing DRAFTs]
    B --> C[computeMenuRecommendations]
    
    subgraph "Scoring Pipeline"
        C --> C1[Aggregate: Dish + StudentVote + MealReview]
        C1 --> C2[Calculate per-dish scores]
        C2 --> C3["finalScore = 0.4×vote + 0.2×review + 0.2×health + 0.2×cost"]
        C3 --> C4[Bulk write to MenuRecommendation]
    end
    
    C4 --> D[buildMessMenu - Standard Variant]
    C4 --> E[buildMessMenu - Low Repetition Variant]
    
    subgraph "MILP Solving (per meal × category)"
        D --> D1[Fetch candidates from MenuRecommendation]
        D1 --> D2[Build history map from past 60 days]
        D2 --> D3[Apply ALLOW_IF filters]
        D3 --> D4[Construct MILP model]
        D4 --> D5[solver.Solve]
        D5 -->|Feasible| D6[Extract assignment]
        D5 -->|Infeasible| D7[Naive fallback + log failure]
    end
    
    D6 --> F[Create MessMenu - DRAFT]
    D7 --> F
    F --> G[Return menuIds to admin]
```

---

## 4. Authentication Flow

```mermaid
flowchart TD
    A[User opens app] --> B{Token in localStorage?}
    B -->|No| C[Show Login Page]
    B -->|Yes| D[GET /api/users/me]
    
    D -->|200 OK| E[Set user in AuthContext]
    D -->|401| F[Try refresh token]
    
    F -->|POST /api/auth/refresh| G{Refresh successful?}
    G -->|Yes| H[Store new tokens]
    H --> I[Retry GET /api/users/me]
    I --> E
    G -->|No| J[Clear tokens]
    J --> C
    
    C --> K[User submits credentials]
    K -->|POST /api/auth/login| L{Valid?}
    L -->|Yes| M[Store tokens + set user]
    M --> N[Redirect to dashboard]
    L -->|No| O[Show error]
    
    subgraph "On any API 401"
        P[API returns 401] --> Q{refreshPromise exists?}
        Q -->|Yes| R[Await existing promise]
        Q -->|No| S[Start new refresh]
        S --> R
        R --> T[Retry original request]
    end
```

---

## 5. Dish Lifecycle

```mermaid
stateDiagram-v2
    [*] --> UNDER_REVIEW: Student suggests dish
    [*] --> ACTIVE: Admin creates dish directly

    UNDER_REVIEW --> ACTIVE: Admin approves (sets scores)
    UNDER_REVIEW --> INACTIVE: Admin rejects (sets reason)
    
    ACTIVE --> INACTIVE: Admin toggles status
    INACTIVE --> ACTIVE: Admin toggles status
    
    ACTIVE --> [*]: Admin deletes (cascade to 6 collections)
    INACTIVE --> [*]: Admin deletes (cascade to 6 collections)
    UNDER_REVIEW --> [*]: Admin deletes (cascade to 6 collections)
```

---

## 6. Menu Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Admin generates menu
    [*] --> DRAFT: Auto-generated (50%+ wantsNewMenu)

    DRAFT --> PUBLISHED: Admin publishes selected variant
    DRAFT --> ARCHIVED: Other variants archived on publish
    DRAFT --> [*]: Deleted before regeneration

    PUBLISHED --> ARCHIVED: New menu published (implicit)
    ARCHIVED --> [*]: Admin deletes
```

---

## 7. Data Model Relationships

```mermaid
graph TD
    H[Hostel] -->|1:N| U[User]
    H -->|1:N| D[Dish]
    H -->|1:N| MM[MessMenu]
    H -->|1:N| I[Issue]
    H -->|1:N| AL[ActivityLog]
    H -->|1:N| MR[MenuRecommendation]
    
    U -->|1:1| SV[StudentVote]
    U -->|1:N| MRev[MealReview]
    U -->|1:N| RT[RefreshToken]
    U -->|1:N| I
    
    D -->|1:N| MR
    D -->|1:N| MRev
    D -.->|referenced in| MM
    D -.->|referenced in| SV
    D -.->|referenced in| H["Hostel.menuConstraints"]
    
    MR -.->|feeds| MM
    SV -.->|feeds| MR
```
