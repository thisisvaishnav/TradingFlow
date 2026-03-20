const DEFAULT_API_BASE_URL = "http://localhost:3001";
const AUTH_TOKEN_KEY = "tradingflow_auth_token";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type AuthPayload = {
  username: string;
  password: string;
};

export type AuthResponse = {
  message: string;
  id: string;
  token: string;
};

export type WorkflowNodePayload = {
  id: string;
  type?: string;
  position?: {
    x: number;
    y: number;
  };
  data: {
    kind: "action" | "trigger" | "notification";
    metadata: Record<string, unknown>;
  };
};

export type CreateWorkflowPayload = {
  name?: string;
  nodes: Array<{
    id: string;
    type: string;
    position: {
      x: number;
      y: number;
    };
    data: {
      kind: "action" | "trigger" | "notification";
      metadata: Record<string, unknown>;
    };
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
};

export type UpdateWorkflowPayload = {
  name?: string;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE";
  isActive?: boolean;
  nodes: WorkflowNodePayload[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
};

export type WorkflowResponse = {
  _id: string;
  userId: string;
  name?: string;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE";
  isActive?: boolean;
  nodes: Array<{
    id: string;
    type?: string;
    position?: {
      x: number;
      y: number;
    };
    data: {
      kind: "ACTION" | "TRIGGER";
      metadata: Record<string, unknown>;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
};

export type WorkflowExecutionResponse = {
  _id: string;
  workflowId: string;
  nodeId: string;
  nodeName?: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  startTime: string;
  endTime?: string;
  error?: string;
  output?: unknown;
};

type RequestOptions = {
  method: HttpMethod;
  path: string;
  body?: unknown;
  token?: string | null;
};

const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!configuredBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  return configuredBaseUrl;
};

export const authStorage = {
  getToken: () => localStorage.getItem(AUTH_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(AUTH_TOKEN_KEY),
};

export class TradingFlowApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = getApiBaseUrl()) {
    this.baseUrl = baseUrl;
  }

  private async request<TResponse>({ method, path, body, token }: RequestOptions): Promise<TResponse> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseBody = (await response.json()) as TResponse | { message?: string };

    if (!response.ok) {
      const errorMessage =
        typeof responseBody === "object" && responseBody !== null && "message" in responseBody
          ? responseBody.message ?? "Request failed"
          : "Request failed";
      throw new Error(errorMessage);
    }

    return responseBody as TResponse;
  }

  async signup(payload: AuthPayload): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>({
      method: "POST",
      path: "/signup",
      body: payload,
    });

    authStorage.setToken(response.token);
    return response;
  }

  async signin(payload: AuthPayload): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>({
      method: "POST",
      path: "/signin",
      body: payload,
    });

    authStorage.setToken(response.token);
    return response;
  }

  async createWorkflow(payload: CreateWorkflowPayload, token = authStorage.getToken()): Promise<{ workflow: WorkflowResponse }> {
    return this.request<{ workflow: WorkflowResponse }>({
      method: "POST",
      path: "/workflow",
      body: payload,
      token,
    });
  }

  async updateWorkflow(
    workflowId: string,
    payload: UpdateWorkflowPayload,
    token = authStorage.getToken(),
  ): Promise<{ workflow: WorkflowResponse }> {
    return this.request<{ workflow: WorkflowResponse }>({
      method: "PUT",
      path: `/workflow/${workflowId}`,
      body: payload,
      token,
    });
  }

  async listWorkflows(token = authStorage.getToken()): Promise<{ workflows: WorkflowResponse[] }> {
    return this.request<{ workflows: WorkflowResponse[] }>({
      method: "GET",
      path: "/workflow",
      token,
    });
  }

  async getWorkflow(workflowId: string, token = authStorage.getToken()): Promise<WorkflowResponse> {
    return this.request<WorkflowResponse>({
      method: "GET",
      path: `/workflow/${workflowId}`,
      token,
    });
  }

  async getWorkflowExecution(
    workflowId: string,
    token = authStorage.getToken(),
  ): Promise<{ executions: WorkflowExecutionResponse[] }> {
    return this.request<{ executions: WorkflowExecutionResponse[] }>({
      method: "GET",
      path: `/workflow/execution/${workflowId}`,
      token,
    });
  }

  async toggleWorkflow(
    workflowId: string,
    token = authStorage.getToken(),
  ): Promise<{ workflow: WorkflowResponse }> {
    return this.request<{ workflow: WorkflowResponse }>({
      method: "PATCH",
      path: `/workflow/${workflowId}/toggle`,
      token,
    });
  }

  async deleteWorkflow(
    workflowId: string,
    token = authStorage.getToken(),
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>({
      method: "DELETE",
      path: `/workflow/${workflowId}`,
      token,
    });
  }
}

export const tradingFlowApiClient = new TradingFlowApiClient();
