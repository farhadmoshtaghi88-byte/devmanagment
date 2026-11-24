import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Client,
  Project,
  ProjectStatus,
  ProjectPayment,
  InfrastructureItem,
  Server,
  Domain,
  Task,
  FinanceSummary,
  StatusConfig,
  StatusColorKey,
  BankAccount,
  SystemUser,
  Product,
  ProductCostItem,
  ProductSale,
  ProductSaleEvent,
  ProductSalesModel,
  ProductSupportPolicy,
  ProductTier,
  Invoice,
  InvoiceItem,
  InvoiceSellerProfile,
  InvoiceStatus
} from '../types';
import {
  MOCK_CLIENTS,
  MOCK_PROJECTS,
  MOCK_PAYMENTS,
  MOCK_EXPENSES,
  MOCK_SERVERS,
  MOCK_DOMAINS,
  MOCK_TASKS,
  MOCK_PRODUCTS,
  MOCK_PRODUCT_COSTS,
  MOCK_PRODUCT_SALES,
  DEFAULT_CLIENT_STATUSES,
  DEFAULT_PROJECT_STATUSES,
  DEFAULT_PROJECT_CATEGORIES,
  DEFAULT_TECH_STACKS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_EXPENSE_TYPES,
  DEFAULT_PRODUCT_COST_TYPES,
  DEFAULT_PRODUCT_DOMAINS,
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_USERS,
  DEFAULT_INVOICE_SELLER_PROFILE,
  getTodayPersianDate,
  addMonthsToPersianDate,
  getProductSupportStatus,
  getNormalizedSaleEvents,
  toPersianDigits
} from '../constants';

export const LOCAL_STORAGE_KEY = 'devmanager_pro_data_v3';

interface DataContextType {
  clients: Client[];
  projects: Project[];
  payments: ProjectPayment[];
  expenses: InfrastructureItem[];
  servers: Server[];
  domains: Domain[];
  tasks: Task[];
  products: Product[];
  productCosts: ProductCostItem[];
  productSales: ProductSale[];

  // Configurable lists
  clientStatuses: StatusConfig[];
  projectStatuses: StatusConfig[];
  projectCategories: string[];
  techStacks: string[];
  expenseCategories: string[];
  expenseTypes: StatusConfig[];
  productCostTypes: string[];
  productDomains: string[];
  bankAccounts: BankAccount[];
  users: SystemUser[];
  currentUser: SystemUser | null;
  invoices: Invoice[];
  invoiceSellerProfile: InvoiceSellerProfile;

  // Navigation helper
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navResetCount: number;
  navigateToMenuTab: (tab: string) => void;
  selectedProjectIdForView: string | null;
  setSelectedProjectIdForView: (id: string | null) => void;
  selectedClientIdForView: string | null;
  setSelectedClientIdForView: (id: string | null) => void;
  selectedProductIdForView: string | null;
  setSelectedProductIdForView: (id: string | null) => void;
  invoiceDraftForBuilder: Invoice | null;
  setInvoiceDraftForBuilder: (draft: Invoice | null) => void;
  exportBackup: () => void;
  importBackup: (jsonData: string) => boolean;

  // Client CRUD
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addClientInteraction: (
    clientId: string,
    interaction: {
      type: 'call' | 'meeting' | 'message' | 'email' | 'contract';
      date: string;
      description: string;
      outcome?: string;
    }
  ) => void;

  // Project CRUD
  addProject: (project: Omit<Project, 'id' | 'paidAmount'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addMilestone: (projectId: string, milestone: { title: string; date: string; description?: string }) => void;

  // Payment CRUD
  addPayment: (payment: Omit<ProjectPayment, 'id'>) => ProjectPayment;
  updatePayment: (id: string, updates: Partial<ProjectPayment>) => void;
  deletePayment: (id: string) => void;

  // Expense & Infrastructure CRUD
  addExpense: (expense: Omit<InfrastructureItem, 'id'>) => InfrastructureItem;
  updateExpense: (id: string, updates: Partial<InfrastructureItem>) => void;
  deleteExpense: (id: string) => void;

  // Server CRUD
  addServer: (server: Omit<Server, 'id'>) => Server;
  updateServer: (id: string, updates: Partial<Server>) => void;
  deleteServer: (id: string) => void;

  // Domain CRUD
  addDomain: (domain: Omit<Domain, 'id'>) => Domain;
  updateDomain: (id: string, updates: Partial<Domain>) => void;
  deleteDomain: (id: string) => void;

  // Task CRUD
  addTask: (task: Omit<Task, 'id'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;

  // Configurable Lists CRUD
  addClientStatus: (label: string, color: StatusColorKey) => void;
  updateClientStatus: (id: string, label: string, color: StatusColorKey) => void;
  deleteClientStatus: (id: string) => void;

  addProjectStatus: (label: string, color: StatusColorKey) => void;
  updateProjectStatus: (id: string, label: string, color: StatusColorKey) => void;
  deleteProjectStatus: (id: string) => void;

  addProjectCategory: (category: string) => void;
  updateProjectCategory: (oldCat: string, newCat: string) => void;
  deleteProjectCategory: (category: string) => void;

  addTechStack: (tech: string) => void;
  updateTechStack: (oldTech: string, newTech: string) => void;
  deleteTechStack: (tech: string) => void;

  addExpenseCategory: (category: string) => void;
  updateExpenseCategory: (oldCat: string, newCat: string) => void;
  deleteExpenseCategory: (category: string) => void;

  addExpenseType: (label: string, color: StatusColorKey) => void;
  updateExpenseType: (id: string, label: string, color: StatusColorKey) => void;
  deleteExpenseType: (id: string) => void;

  addProductCostType: (costType: string) => void;
  updateProductCostType: (oldType: string, newType: string) => void;
  deleteProductCostType: (costType: string) => void;

  addProductDomain: (domain: string) => void;
  updateProductDomain: (oldDomain: string, newDomain: string) => void;
  deleteProductDomain: (domain: string) => void;

  // Invoices & Seller Profile CRUD
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  updateInvoiceSellerProfile: (updates: Partial<InvoiceSellerProfile>) => void;
  buildInvoiceFromProject: (projectId: string) => Invoice | null;
  buildInvoiceFromProductSale: (saleId: string) => Invoice | null;

  // Products CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Product Costs CRUD
  addProductCost: (cost: Omit<ProductCostItem, 'id'>) => ProductCostItem;
  updateProductCost: (id: string, updates: Partial<ProductCostItem>) => void;
  deleteProductCost: (id: string) => void;

  // Product Sales & Support CRUD
  addProductSale: (sale: Omit<ProductSale, 'id' | 'remainingAmount'>) => ProductSale;
  updateProductSale: (id: string, updates: Partial<ProductSale>) => void;
  deleteProductSale: (id: string) => void;
  recordProductSalePayment: (
    saleId: string,
    amount: number,
    method: ProductSale['method'],
    bankAccountId: string,
    trackingCode?: string,
    date?: string,
    notes?: string
  ) => void;
  deleteProductSaleEvent: (saleId: string, eventId: string) => void;
  renewProductSupport: (
    saleId: string,
    months: number,
    renewalFee: number,
    method: ProductSale['method'],
    bankAccountId: string,
    trackingCode?: string,
    date?: string,
    paidAmount?: number,
    notes?: string
  ) => void;
  upgradeProductSaleTier: (
    saleId: string,
    targetTierId: string,
    upgradeFee: number,
    paidAmount: number,
    method: ProductSale['method'],
    bankAccountId: string,
    trackingCode?: string,
    date?: string,
    notes?: string
  ) => void;
  convertProjectToProduct: (params: {
    projectId: string;
    productName: string;
    domain: string;
    description?: string;
    salesModel: ProductSalesModel;
    oneTimePrice?: number;
    monthlyPrice?: number;
    annualPrice?: number;
    tiers?: ProductTier[];
    supportPolicy: ProductSupportPolicy;
    defaultSupportMonths: number;
    supportRenewalPrice?: number;
    productizationCost?: number;
    includeFounderInSupport: boolean;
    founderTierId?: string;
    founderSupportMonths?: number;
    founderSupportStartDate?: string;
  }) => Product | null;

  // Bank Account CRUD
  addBankAccount: (account: Omit<BankAccount, 'id'>) => BankAccount;
  updateBankAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  // User CRUD
  addUser: (user: Omit<SystemUser, 'id' | 'createdAt'>) => SystemUser;
  updateUser: (id: string, updates: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;
  changeCurrentUserPassword: (currentPassword: string, newPassword: string) => { ok: boolean; message: string };

  // Analytical helpers
  getClientStats: (clientId: string) => {
    projectCount: number;
    activeProjectCount: number;
    totalContractValue: number;
    totalPaid: number;
    remainingDebt: number;
    totalExpenses: number;
    paidExpenses: number;
    netProfit: number; // Contract-based: totalContractValue - totalExpenses
    cashNetProfit: number; // Cash-based: totalPaid - paidExpenses
    projects: Project[];
    payments: ProjectPayment[];
    expenses: InfrastructureItem[];
    productSales: ProductSale[];
    totalProductSpend: number;
    productRemainingDebt: number;
  };

  getProjectStats: (projectId: string) => {
    contractValue: number;
    totalPaid: number;
    remainingBalance: number;
    totalExpenses: number;
    paidExpenses: number;
    pendingExpenses: number;
    commissionExpenses: number;
    infraExpenses: number;
    otherExpenses: number;
    netProfit: number; // Contract-based: contractValue - totalExpenses
    cashNetProfit: number; // Cash-based: totalPaid - paidExpenses
    paidPercentage: number;
    expenses: InfrastructureItem[];
    payments: ProjectPayment[];
    servers: Server[];
    domains: Domain[];
    tasks: Task[];
  };

  getProductStats: (productId: string) => {
    totalCost: number;
    paidCost: number;
    pendingCost: number;
    devCost: number;
    infraCost: number;
    marketingCost: number;
    otherCost: number;
    salesCount: number;
    totalUnitsSold: number;
    totalSalesValue: number;
    totalPaid: number;
    remainingReceivables: number;
    totalVariableCost: number;
    netProfit: number; // totalSalesValue - totalCost - totalVariableCost
    cashNetProfit: number; // totalPaid - paidCost - totalVariableCost
    roiPercent: number;
    referenceUnitPrice: number;
    unitNetContribution: number;
    suggestedPriceByMargin: number;
    actualMarginPercent: number;
    breakEvenUnits: number;
    remainingUnitsToBreakEven: number;
    breakEvenProgressPercent: number;
    isProfitable: boolean;
    activeSupportCount: number;
    expiringSupportCount: number;
    expiredSupportCount: number;
    costs: ProductCostItem[];
    sales: ProductSale[];
  };

  financeSummary: FinanceSummary;
  topClients: Array<{
    client: Client;
    totalSpent: number;
    totalContractValue: number;
    totalNetProfit: number;
    projectCount: number;
    remainingDebt: number;
  }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function loadState<T>(suffix: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${suffix}`);
    if (saved) return JSON.parse(saved) as T;
    // Migrate legacy v2 keys if available
    const legacy = localStorage.getItem(`devmanager_pro_data_v2_${suffix}`);
    if (legacy) return JSON.parse(legacy) as T;
  } catch {
    // ignore parse error
  }
  return fallback;
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [navResetCount, setNavResetCount] = useState<number>(0);
  const [selectedProjectIdForView, setSelectedProjectIdForView] = useState<string | null>(null);
  const [selectedClientIdForView, setSelectedClientIdForView] = useState<string | null>(null);
  const [selectedProductIdForView, setSelectedProductIdForView] = useState<string | null>(null);
  const [invoiceDraftForBuilder, setInvoiceDraftForBuilder] = useState<Invoice | null>(null);

  const navigateToMenuTab = (tab: string) => {
    setSelectedProjectIdForView(null);
    setSelectedClientIdForView(null);
    setSelectedProductIdForView(null);
    setActiveTab(tab);
    setNavResetCount((prev) => prev + 1);
  };

  const [clients, setClients] = useState<Client[]>(() => loadState('clients', MOCK_CLIENTS));
  const [projects, setProjects] = useState<Project[]>(() => loadState('projects', MOCK_PROJECTS));
  const [payments, setPayments] = useState<ProjectPayment[]>(() => loadState('payments', MOCK_PAYMENTS));
  const [expenses, setExpenses] = useState<InfrastructureItem[]>(() => loadState('expenses', MOCK_EXPENSES));
  const [servers, setServers] = useState<Server[]>(() => loadState('servers', MOCK_SERVERS));
  const [domains, setDomains] = useState<Domain[]>(() => loadState('domains', MOCK_DOMAINS));
  const [tasks, setTasks] = useState<Task[]>(() => loadState('tasks', MOCK_TASKS));
  const [products, setProducts] = useState<Product[]>(() => loadState('products', MOCK_PRODUCTS));
  const [productCosts, setProductCosts] = useState<ProductCostItem[]>(() =>
    loadState('productCosts', MOCK_PRODUCT_COSTS)
  );
  const [productSales, setProductSales] = useState<ProductSale[]>(() =>
    loadState('productSales', MOCK_PRODUCT_SALES)
  );

  const [clientStatuses, setClientStatuses] = useState<StatusConfig[]>(() =>
    loadState('clientStatuses', DEFAULT_CLIENT_STATUSES)
  );
  const [projectStatuses, setProjectStatuses] = useState<StatusConfig[]>(() =>
    loadState('projectStatuses', DEFAULT_PROJECT_STATUSES)
  );
  const [projectCategories, setProjectCategories] = useState<string[]>(() =>
    loadState('projectCategories', DEFAULT_PROJECT_CATEGORIES)
  );
  const [techStacks, setTechStacks] = useState<string[]>(() =>
    loadState('techStacks', DEFAULT_TECH_STACKS)
  );
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() =>
    loadState('expenseCategories', DEFAULT_EXPENSE_CATEGORIES)
  );
  const [expenseTypes, setExpenseTypes] = useState<StatusConfig[]>(() =>
    loadState('expenseTypes', DEFAULT_EXPENSE_TYPES)
  );
  const [productCostTypes, setProductCostTypes] = useState<string[]>(() =>
    loadState('productCostTypes', DEFAULT_PRODUCT_COST_TYPES)
  );
  const [productDomains, setProductDomains] = useState<string[]>(() =>
    loadState('productDomains', DEFAULT_PRODUCT_DOMAINS)
  );
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() =>
    loadState('bankAccounts', DEFAULT_BANK_ACCOUNTS)
  );
  const [users, setUsers] = useState<SystemUser[]>(() =>
    loadState('users', DEFAULT_USERS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadState('invoices', []));
  const [invoiceSellerProfile, setInvoiceSellerProfile] = useState<InvoiceSellerProfile>(() =>
    loadState('invoiceSellerProfile', DEFAULT_INVOICE_SELLER_PROFILE)
  );

  // Determine current logged-in user
  const loggedInUserId =
    localStorage.getItem('shaygan_auth_user_id') ||
    sessionStorage.getItem('shaygan_auth_user_id') ||
    users[0]?.id;

  const currentUser = users.find((u) => u.id === loggedInUserId) || users[0] || null;

  // Persist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_clients`, JSON.stringify(clients));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_projects`, JSON.stringify(projects));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_payments`, JSON.stringify(payments));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_servers`, JSON.stringify(servers));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_domains`, JSON.stringify(domains));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_tasks`, JSON.stringify(tasks));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_products`, JSON.stringify(products));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_productCosts`, JSON.stringify(productCosts));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_productSales`, JSON.stringify(productSales));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_clientStatuses`, JSON.stringify(clientStatuses));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_projectStatuses`, JSON.stringify(projectStatuses));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_projectCategories`, JSON.stringify(projectCategories));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_techStacks`, JSON.stringify(techStacks));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenseCategories`, JSON.stringify(expenseCategories));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_expenseTypes`, JSON.stringify(expenseTypes));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_productCostTypes`, JSON.stringify(productCostTypes));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_productDomains`, JSON.stringify(productDomains));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_bankAccounts`, JSON.stringify(bankAccounts));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_invoices`, JSON.stringify(invoices));
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY}_invoiceSellerProfile`,
        JSON.stringify(invoiceSellerProfile)
      );
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [
    clients,
    projects,
    payments,
    expenses,
    servers,
    domains,
    tasks,
    products,
    productCosts,
    productSales,
    clientStatuses,
    projectStatuses,
    projectCategories,
    techStacks,
    expenseCategories,
    expenseTypes,
    productCostTypes,
    productDomains,
    bankAccounts,
    users,
    invoices,
    invoiceSellerProfile
  ]);

  // Helper to sync a project's paidAmount from actual payments array
  const syncProjectPaidAmount = (projectId: string, nextPayments: ProjectPayment[]) => {
    const newPaid = nextPayments
      .filter((p) => p.projectId === projectId && p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    setProjects((prev) => prev.map((proj) => (proj.id === projectId ? { ...proj, paidAmount: newPaid } : proj)));
  };

  // Client CRUD (always newest first!)
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const now = Date.now();
    const newClient: Client = {
      ...clientData,
      id: `c-${now}`,
      createdAt: getTodayPersianDate(),
      createdTimestamp: now,
      interactions: clientData.interactions || []
    };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    // Keep clientName synced on projects if name/company changed
    if (updates.name || updates.company) {
      const target = clients.find((c) => c.id === id);
      if (target) {
        const nextName = `${updates.name ?? target.name} (${updates.company ?? target.company})`;
        setProjects((prev) => prev.map((p) => (p.clientId === id ? { ...p, clientName: nextName } : p)));
      }
    }
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const addClientInteraction = (
    clientId: string,
    interaction: {
      type: 'call' | 'meeting' | 'message' | 'email' | 'contract';
      date: string;
      description: string;
      outcome?: string;
    }
  ) => {
    const now = Date.now();
    const newInter = {
      id: `inter-${now}`,
      createdTimestamp: now,
      ...interaction
    };
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, interactions: [newInter, ...(c.interactions || [])] } : c))
    );
  };

  // Project CRUD (newest first!)
  const addProject = (projectData: Omit<Project, 'id' | 'paidAmount'>): Project => {
    const now = Date.now();
    const client = clients.find((c) => c.id === projectData.clientId);
    const newProject: Project = {
      ...projectData,
      id: `p-${now}`,
      createdTimestamp: now,
      clientName: client ? `${client.name} (${client.company})` : projectData.clientName || '',
      paidAmount: 0,
      milestones: projectData.milestones || []
    };
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setPayments((prev) => prev.filter((pay) => pay.projectId !== id));
    setExpenses((prev) => prev.filter((exp) => exp.projectId !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId && p.milestones) {
          const updated = p.milestones.map((m) =>
            m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
          );
          const completedCount = updated.filter((m) => m.isCompleted).length;
          const progress = Math.round((completedCount / updated.length) * 100);
          return { ...p, milestones: updated, progress: updated.length > 0 ? progress : p.progress };
        }
        return p;
      })
    );
  };

  const addMilestone = (projectId: string, milestone: { title: string; date: string; description?: string }) => {
    const now = Date.now();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const newM = {
            id: `m-${now}`,
            title: milestone.title,
            date: milestone.date,
            description: milestone.description,
            isCompleted: false,
            createdTimestamp: now
          };
          return { ...p, milestones: [newM, ...(p.milestones || [])] };
        }
        return p;
      })
    );
  };

  // Payment CRUD (newest first + sync project paidAmount!)
  const addPayment = (paymentData: Omit<ProjectPayment, 'id'>): ProjectPayment => {
    const now = Date.now();
    const project = projects.find((p) => p.id === paymentData.projectId);
    const client = clients.find((c) => c.id === (project?.clientId || paymentData.clientId));
    const bankAcc = bankAccounts.find((b) => b.id === paymentData.bankAccountId);

    const newPayment: ProjectPayment = {
      ...paymentData,
      id: `pay-${now}`,
      createdTimestamp: now,
      projectName: project?.title || paymentData.projectName || '',
      clientId: client?.id || paymentData.clientId,
      clientName: client ? `${client.name} (${client.company})` : paymentData.clientName,
      bankAccountLabel:
        paymentData.bankAccountLabel ||
        (bankAcc ? `${bankAcc.bankName} - ${bankAcc.accountHolder}` : undefined)
    };

    const nextPayments = [newPayment, ...payments];
    setPayments(nextPayments);
    if (project) {
      syncProjectPaidAmount(project.id, nextPayments);
    }
    return newPayment;
  };

  const updatePayment = (id: string, updates: Partial<ProjectPayment>) => {
    const target = payments.find((p) => p.id === id);
    const nextPayments = payments.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPayments(nextPayments);
    if (target?.projectId) {
      syncProjectPaidAmount(target.projectId, nextPayments);
    }
  };

  const deletePayment = (id: string) => {
    const target = payments.find((p) => p.id === id);
    const nextPayments = payments.filter((p) => p.id !== id);
    setPayments(nextPayments);
    if (target?.projectId) {
      syncProjectPaidAmount(target.projectId, nextPayments);
    }
  };

  // Expense & Infrastructure CRUD (newest first!)
  const addExpense = (expenseData: Omit<InfrastructureItem, 'id'>): InfrastructureItem => {
    const now = Date.now();
    const project = projects.find((p) => p.id === expenseData.projectId);
    const client = clients.find((c) => c.id === (project?.clientId || expenseData.clientId));

    const newExpense: InfrastructureItem = {
      ...expenseData,
      id: `exp-${now}`,
      createdTimestamp: now,
      paymentStatus: expenseData.paymentStatus || 'paid',
      projectName: project?.title || expenseData.projectName,
      clientId: client?.id || expenseData.clientId,
      clientName: client ? `${client.name} (${client.company})` : expenseData.clientName
    };

    setExpenses((prev) => [newExpense, ...prev]);

    if (expenseData.type === 'server' && expenseData.ip) {
      const newServer: Server = {
        id: `s-${now}`,
        createdTimestamp: now,
        name: expenseData.title,
        provider: expenseData.provider,
        ip: expenseData.ip,
        os: 'Linux (Ubuntu/Debian)',
        purchaseCost: expenseData.purchaseCost,
        purchaseDate: expenseData.purchaseDate,
        expiration: expenseData.expirationDate || '',
        billingCycle: expenseData.billingCycle === 'one-time' || !expenseData.billingCycle ? 'monthly' : expenseData.billingCycle,
        projectId: expenseData.projectId,
        projectName: project?.title,
        clientId: client?.id,
        clientName: client?.name,
        status: expenseData.status === 'expired' ? 'expired' : 'online',
        notes: expenseData.credentialsNotes,
        cpu: expenseData.specs
      };
      setServers((prev) => [newServer, ...prev]);
    } else if (expenseData.type === 'domain') {
      const newDomain: Domain = {
        id: `d-${now}`,
        createdTimestamp: now,
        url: expenseData.title,
        registrar: expenseData.provider,
        purchaseCost: expenseData.purchaseCost,
        purchaseDate: expenseData.purchaseDate,
        expiration: expenseData.expirationDate || '',
        autoRenew: expenseData.autoRenew ?? true,
        projectId: expenseData.projectId,
        projectName: project?.title,
        clientId: client?.id,
        clientName: client?.name,
        sslStatus: 'active'
      };
      setDomains((prev) => [newDomain, ...prev]);
    }

    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<InfrastructureItem>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Server CRUD
  const addServer = (serverData: Omit<Server, 'id'>): Server => {
    const now = Date.now();
    const project = projects.find((p) => p.id === serverData.projectId);
    const client = clients.find((c) => c.id === (project?.clientId || serverData.clientId));

    const newServer: Server = {
      ...serverData,
      id: `s-${now}`,
      createdTimestamp: now,
      projectName: project?.title || serverData.projectName,
      clientId: client?.id || serverData.clientId,
      clientName: client ? client.name : serverData.clientName
    };

    setServers((prev) => [newServer, ...prev]);

    const newExp: InfrastructureItem = {
      id: `exp-${now + 1}`,
      createdTimestamp: now,
      projectId: serverData.projectId,
      projectName: project?.title,
      clientId: client?.id,
      clientName: client?.name,
      type: 'server',
      title: serverData.name,
      provider: serverData.provider,
      purchaseCost: serverData.purchaseCost || 0,
      purchaseDate: serverData.purchaseDate || getTodayPersianDate(),
      expirationDate: serverData.expiration,
      billingCycle: serverData.billingCycle || 'monthly',
      ip: serverData.ip,
      specs: `${serverData.cpu || ''} ${serverData.ram || ''} ${serverData.storage || ''}`.trim(),
      autoRenew: true,
      status: serverData.status === 'expired' ? 'expired' : 'active',
      paymentStatus: 'paid',
      credentialsNotes: `SSH Port: ${serverData.sshPort || '22'}, User: ${serverData.sshUser || 'root'}. ${serverData.notes || ''}`
    };
    setExpenses((prev) => [newExp, ...prev]);

    return newServer;
  };

  const updateServer = (id: string, updates: Partial<Server>) => {
    setServers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteServer = (id: string) => {
    setServers((prev) => prev.filter((s) => s.id !== id));
  };

  // Domain CRUD
  const addDomain = (domainData: Omit<Domain, 'id'>): Domain => {
    const now = Date.now();
    const project = projects.find((p) => p.id === domainData.projectId);
    const client = clients.find((c) => c.id === (project?.clientId || domainData.clientId));

    const newDomain: Domain = {
      ...domainData,
      id: `d-${now}`,
      createdTimestamp: now,
      projectName: project?.title || domainData.projectName,
      clientId: client?.id || domainData.clientId,
      clientName: client ? client.name : domainData.clientName
    };

    setDomains((prev) => [newDomain, ...prev]);

    const newExp: InfrastructureItem = {
      id: `exp-${now + 1}`,
      createdTimestamp: now,
      projectId: domainData.projectId,
      projectName: project?.title,
      clientId: client?.id,
      clientName: client?.name,
      type: 'domain',
      title: domainData.url,
      provider: domainData.registrar,
      purchaseCost: domainData.purchaseCost || 0,
      purchaseDate: domainData.purchaseDate || getTodayPersianDate(),
      expirationDate: domainData.expiration,
      billingCycle: 'annual',
      autoRenew: domainData.autoRenew,
      status: 'active',
      paymentStatus: 'paid'
    };
    setExpenses((prev) => [newExp, ...prev]);

    return newDomain;
  };

  const updateDomain = (id: string, updates: Partial<Domain>) => {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDomain = (id: string) => {
    setDomains((prev) => prev.filter((d) => d.id !== id));
  };

  // Task CRUD
  const addTask = (taskData: Omit<Task, 'id'>): Task => {
    const now = Date.now();
    const project = projects.find((p) => p.id === taskData.projectId);
    const newTask: Task = {
      ...taskData,
      id: `t-${now}`,
      createdTimestamp: now,
      projectName: project?.title || taskData.projectName
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus: 'todo' | 'doing' | 'done' =
            t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // Configurable Lists CRUD
  const addClientStatus = (label: string, color: StatusColorKey) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = `cs-${Date.now()}`;
    setClientStatuses((prev) => [...prev, { id, label: trimmed, color }]);
  };

  const updateClientStatus = (id: string, label: string, color: StatusColorKey) => {
    setClientStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, label: label.trim(), color } : s)));
  };

  const deleteClientStatus = (id: string) => {
    if (clientStatuses.length <= 1) return;
    const remaining = clientStatuses.filter((s) => s.id !== id);
    const fallbackId = remaining[0].id;
    setClientStatuses(remaining);
    setClients((prev) => prev.map((c) => (c.status === id ? { ...c, status: fallbackId } : c)));
  };

  const addProjectStatus = (label: string, color: StatusColorKey) => {
    const trimmed = label.trim();
    if (!trimmed || projectStatuses.some((s) => s.label === trimmed)) return;
    setProjectStatuses((prev) => [...prev, { id: trimmed, label: trimmed, color }]);
  };

  const updateProjectStatus = (id: string, label: string, color: StatusColorKey) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setProjectStatuses((prev) => prev.map((s) => (s.id === id ? { ...s, id: trimmed, label: trimmed, color } : s)));
    if (id !== trimmed) {
      setProjects((prev) => prev.map((p) => (p.status === id ? { ...p, status: trimmed } : p)));
    }
  };

  const deleteProjectStatus = (id: string) => {
    if (projectStatuses.length <= 1) return;
    const remaining = projectStatuses.filter((s) => s.id !== id);
    const fallback = remaining[0].id;
    setProjectStatuses(remaining);
    setProjects((prev) => prev.map((p) => (p.status === id ? { ...p, status: fallback } : p)));
  };

  const addProjectCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed || projectCategories.includes(trimmed)) return;
    setProjectCategories((prev) => [trimmed, ...prev]);
  };

  const updateProjectCategory = (oldCat: string, newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setProjectCategories((prev) => prev.map((c) => (c === oldCat ? trimmed : c)));
    setProjects((prev) => prev.map((p) => (p.category === oldCat ? { ...p, category: trimmed } : p)));
  };

  const deleteProjectCategory = (category: string) => {
    if (projectCategories.length <= 1) return;
    const remaining = projectCategories.filter((c) => c !== category);
    setProjectCategories(remaining);
    setProjects((prev) => prev.map((p) => (p.category === category ? { ...p, category: remaining[0] } : p)));
  };

  const addTechStack = (tech: string) => {
    const trimmed = tech.trim();
    if (!trimmed || techStacks.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    setTechStacks((prev) => [trimmed, ...prev]);
  };

  const updateTechStack = (oldTech: string, newTech: string) => {
    const trimmed = newTech.trim();
    if (!trimmed) return;
    setTechStacks((prev) => prev.map((t) => (t === oldTech ? trimmed : t)));
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        stack: p.stack.map((st) => (st === oldTech ? trimmed : st))
      }))
    );
  };

  const deleteTechStack = (tech: string) => {
    setTechStacks((prev) => prev.filter((t) => t !== tech));
  };

  const addExpenseCategory = (category: string) => {
    const trimmed = category.trim();
    if (!trimmed || expenseCategories.includes(trimmed)) return;
    setExpenseCategories((prev) => [trimmed, ...prev]);
  };

  const updateExpenseCategory = (oldCat: string, newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setExpenseCategories((prev) => prev.map((c) => (c === oldCat ? trimmed : c)));
    setExpenses((prev) => prev.map((e) => (e.categoryTitle === oldCat ? { ...e, categoryTitle: trimmed } : e)));
  };

  const deleteExpenseCategory = (category: string) => {
    if (expenseCategories.length <= 1) return;
    setExpenseCategories((prev) => prev.filter((c) => c !== category));
  };

  // Expense Types CRUD (Global editable expense types)
  const addExpenseType = (label: string, color: StatusColorKey) => {
    const trimmed = label.trim();
    if (!trimmed || expenseTypes.some((t) => t.label === trimmed)) return;
    const id = `et-${Date.now()}`;
    setExpenseTypes((prev) => [...prev, { id, label: trimmed, color }]);
  };

  const updateExpenseType = (id: string, label: string, color: StatusColorKey) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setExpenseTypes((prev) => prev.map((t) => (t.id === id ? { ...t, label: trimmed, color } : t)));
  };

  const deleteExpenseType = (id: string) => {
    if (expenseTypes.length <= 1) return;
    const remaining = expenseTypes.filter((t) => t.id !== id);
    const fallbackId = remaining[0].id;
    setExpenseTypes(remaining);
    setExpenses((prev) => prev.map((e) => (e.type === id ? { ...e, type: fallbackId } : e)));
  };

  // Product Cost Types CRUD
  const addProductCostType = (costType: string) => {
    const trimmed = costType.trim();
    if (!trimmed || productCostTypes.includes(trimmed)) return;
    setProductCostTypes((prev) => [...prev, trimmed]);
  };

  const updateProductCostType = (oldType: string, newType: string) => {
    const trimmed = newType.trim();
    if (!trimmed) return;
    setProductCostTypes((prev) => prev.map((t) => (t === oldType ? trimmed : t)));
    setProductCosts((prev) => prev.map((c) => (c.costType === oldType ? { ...c, costType: trimmed } : c)));
  };

  const deleteProductCostType = (costType: string) => {
    if (productCostTypes.length <= 1) return;
    const remaining = productCostTypes.filter((t) => t !== costType);
    setProductCostTypes(remaining);
    setProductCosts((prev) => prev.map((c) => (c.costType === costType ? { ...c, costType: remaining[0] } : c)));
  };

  // Product Domains CRUD
  const addProductDomain = (domain: string) => {
    const trimmed = domain.trim();
    if (!trimmed || productDomains.includes(trimmed)) return;
    setProductDomains((prev) => [trimmed, ...prev]);
  };

  const updateProductDomain = (oldDomain: string, newDomain: string) => {
    const trimmed = newDomain.trim();
    if (!trimmed) return;
    setProductDomains((prev) => prev.map((d) => (d === oldDomain ? trimmed : d)));
    setProducts((prev) => prev.map((p) => (p.domain === oldDomain ? { ...p, domain: trimmed } : p)));
  };

  const deleteProductDomain = (domain: string) => {
    if (productDomains.length <= 1) return;
    const remaining = productDomains.filter((d) => d !== domain);
    setProductDomains(remaining);
    setProducts((prev) => prev.map((p) => (p.domain === domain ? { ...p, domain: remaining[0] } : p)));
  };

  // Invoices & Seller Profile CRUD
  const addInvoice = (invoiceData: Omit<Invoice, 'id'>): Invoice => {
    const now = Date.now();
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${now}`,
      createdTimestamp: invoiceData.createdTimestamp || now
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const updateInvoiceSellerProfile = (updates: Partial<InvoiceSellerProfile>) => {
    setInvoiceSellerProfile((prev) => ({ ...prev, ...updates }));
  };

  const buildInvoiceFromProject = (projectId: string): Invoice | null => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;
    const client = clients.find((c) => c.id === project.clientId);
    const projectPayments = payments.filter((p) => p.projectId === project.id && p.status === 'completed');
    const paidAmount = projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const baseAmount =
      project.baseContractValue && project.baseContractValue > 0
        ? project.baseContractValue
        : project.contractValue;
    const discountAmount = Math.max(0, project.discountAmount || 0);
    const taxRate = Math.max(0, project.taxRate || 0);
    const taxAmount = Math.max(0, project.taxAmount || 0);
    const totalAmount = project.contractValue;
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const status: InvoiceStatus =
      remainingAmount === 0 && totalAmount > 0
        ? 'پرداخت‌شده'
        : paidAmount > 0
        ? 'پرداخت جزئی'
        : 'در انتظار پرداخت';

    const defaultBankId =
      invoiceSellerProfile.defaultBankAccountId ||
      bankAccounts.find((b) => b.isDefault)?.id ||
      bankAccounts[0]?.id;

    const codeSuffix = project.id.replace(/[^0-9]/g, '').slice(-4) || '101';
    const items: InvoiceItem[] = [
      {
        id: `item-proj-${project.id}`,
        title: `طراحی و اجرای پروژه: ${project.title}`,
        description:
          project.description ||
          `${project.category || 'پروژه نرم‌افزاری'}${project.stack?.length ? ` — تکنولوژی‌ها: ${project.stack.join('، ')}` : ''}`,
        quantity: 1,
        unit: 'قرارداد',
        unitPrice: baseAmount,
        discount: 0
      }
    ];

    return {
      id: `auto-proj-${project.id}`,
      invoiceNumber: `SH-PRJ-${codeSuffix}`,
      documentType: paidAmount > 0 ? 'فاکتور فروش' : 'پیش‌فاکتور',
      theme: 'shayegan',
      status,
      sourceType: 'project',
      sourceId: project.id,
      sourceTitle: project.title,
      issueDate: project.startDate || getTodayPersianDate(),
      dueDate: project.deadline || undefined,
      clientId: client?.id,
      buyerName: client?.name || project.clientName || 'کارفرما',
      buyerCompany: client?.company,
      buyerPhone: client?.phone,
      buyerEmail: client?.email,
      buyerAddress: client?.address,
      items,
      discountType: project.discountType || 'amount',
      discountValue: project.discountValue ?? discountAmount,
      discountAmount,
      taxRate,
      taxAmount,
      subtotal: baseAmount,
      totalAmount,
      paidAmount,
      remainingAmount,
      bankAccountId: defaultBankId,
      notes:
        projectPayments.length > 0
          ? `تعداد ${toPersianDigits(projectPayments.length)} فقره واریزی ثبت‌شده در پرونده پروژه.`
          : project.notes,
      terms: invoiceSellerProfile.defaultTerms,
      createdTimestamp: project.createdTimestamp || Date.now()
    };
  };

  const buildInvoiceFromProductSale = (saleId: string): Invoice | null => {
    const sale = productSales.find((s) => s.id === saleId);
    if (!sale) return null;
    const product = products.find((p) => p.id === sale.productId);
    const client = sale.clientId ? clients.find((c) => c.id === sale.clientId) : undefined;
    const events = getNormalizedSaleEvents(sale);

    const items: InvoiceItem[] = [];
    let computedDiscount = 0;

    // Build crisp itemized rows from purchase, upgrades, and renewals
    const billableEvents = events.filter((e) => e.type !== 'payment');
    if (billableEvents.length > 0) {
      billableEvents.forEach((evt, idx) => {
        if (idx === 0 && evt.type === 'purchase') {
          const qty = Math.max(1, sale.quantity || 1);
          const gross = qty * (sale.unitPrice || 0);
          const lineDiscount = Math.max(0, sale.discount || 0);
          computedDiscount += lineDiscount;
          items.push({
            id: `item-evt-${evt.id}`,
            title: `${product?.name || sale.productName || 'محصول نرم‌افزاری'}${
              sale.tierName && billableEvents.length === 1
                ? ` — ${sale.tierName}`
                : evt.toTierName
                ? ` — ${evt.toTierName}`
                : ''
            }`,
            description: `${sale.saleType}${
              sale.hasSupport && sale.supportMonths
                ? ` · شامل ${toPersianDigits(sale.supportMonths)} ماه پشتیبانی اولیه`
                : ''
            }`,
            quantity: qty,
            unit: 'لایسنس',
            unitPrice: sale.unitPrice > 0 ? sale.unitPrice : evt.amountDelta,
            discount: lineDiscount
          });
        } else {
          items.push({
            id: `item-evt-${evt.id}`,
            title: evt.title,
            description:
              evt.type === 'upgrade' && evt.fromTierName && evt.toTierName
                ? `ارتقا از «${evt.fromTierName}» به «${evt.toTierName}» — تاریخ ${toPersianDigits(evt.date)}`
                : evt.type === 'renewal' && evt.supportMonthsAdded
                ? `تمدید پشتیبانی به مدت ${toPersianDigits(evt.supportMonthsAdded)} ماه — تاریخ ${toPersianDigits(evt.date)}`
                : `تاریخ ثبت: ${toPersianDigits(evt.date)}`,
            quantity: 1,
            unit: evt.type === 'renewal' ? 'دوره' : 'مورد',
            unitPrice: evt.amountDelta,
            discount: 0
          });
        }
      });
    } else {
      const qty = Math.max(1, sale.quantity || 1);
      computedDiscount = Math.max(0, sale.discount || 0);
      items.push({
        id: `item-sale-${sale.id}`,
        title: `${product?.name || sale.productName || 'محصول نرم‌افزاری'}${
          sale.tierName ? ` — ${sale.tierName}` : ''
        }`,
        description: sale.saleType,
        quantity: qty,
        unit: 'لایسنس',
        unitPrice: sale.unitPrice || sale.totalAmount,
        discount: computedDiscount
      });
    }

    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const totalAmount = sale.totalAmount;
    const paidAmount = sale.paidAmount;
    const remainingAmount = Math.max(0, sale.remainingAmount);

    const status: InvoiceStatus =
      remainingAmount === 0
        ? 'پرداخت‌شده'
        : paidAmount > 0
        ? 'پرداخت جزئی'
        : 'در انتظار پرداخت';

    const defaultBankId =
      sale.bankAccountId ||
      invoiceSellerProfile.defaultBankAccountId ||
      bankAccounts.find((b) => b.isDefault)?.id ||
      bankAccounts[0]?.id;

    const codeSuffix = sale.id.replace(/[^0-9]/g, '').slice(-4) || '201';

    return {
      id: `auto-sale-${sale.id}`,
      invoiceNumber: `SH-PRD-${codeSuffix}`,
      documentType: 'فاکتور فروش',
      theme: 'shayegan',
      status,
      sourceType: 'product_sale',
      sourceId: sale.id,
      sourceTitle: `${product?.name || sale.productName || 'محصول'}${sale.tierName ? ` (${sale.tierName})` : ''}`,
      issueDate: sale.date || getTodayPersianDate(),
      dueDate: sale.supportEndDate || sale.subscriptionEndDate,
      clientId: client?.id || sale.clientId,
      buyerName: sale.buyerName,
      buyerCompany: sale.buyerCompany || client?.company,
      buyerPhone: client?.phone,
      buyerEmail: client?.email,
      buyerAddress: client?.address,
      items,
      discountType: 'amount',
      discountValue: 0,
      discountAmount: 0, // line-level discount already captured on purchase row
      taxRate: 0,
      taxAmount: 0,
      subtotal: Math.max(0, subtotal - computedDiscount),
      totalAmount,
      paidAmount,
      remainingAmount,
      bankAccountId: defaultBankId,
      notes: sale.isFounderLicense
        ? 'مشتری بنیان‌گذار پروژه اولیه — مبلغ قرارداد اولیه در پرونده پروژه محاسبه شده است.'
        : sale.notes,
      terms: invoiceSellerProfile.defaultTerms,
      createdTimestamp: sale.createdTimestamp || Date.now()
    };
  };

  // Products CRUD (newest first!)
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const now = Date.now();
    const newProduct: Product = {
      ...productData,
      id: `prod-${now}`,
      createdAt: getTodayPersianDate(),
      createdTimestamp: now
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (updates.name) {
      setProductCosts((prev) =>
        prev.map((c) => (c.productId === id ? { ...c, productName: updates.name } : c))
      );
      setProductSales((prev) =>
        prev.map((s) => (s.productId === id ? { ...s, productName: updates.name } : s))
      );
    }
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setProductCosts((prev) => prev.filter((c) => c.productId !== id));
    setProductSales((prev) => prev.filter((s) => s.productId !== id));
  };

  // Product Costs CRUD (newest first!)
  const addProductCost = (costData: Omit<ProductCostItem, 'id'>): ProductCostItem => {
    const now = Date.now();
    const product = products.find((p) => p.id === costData.productId);
    const newCost: ProductCostItem = {
      ...costData,
      id: `pc-${now}`,
      productName: product?.name || costData.productName || '',
      createdTimestamp: now
    };
    setProductCosts((prev) => [newCost, ...prev]);
    return newCost;
  };

  const updateProductCost = (id: string, updates: Partial<ProductCostItem>) => {
    setProductCosts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteProductCost = (id: string) => {
    setProductCosts((prev) => prev.filter((c) => c.id !== id));
  };

  // Product Sales & Support CRUD (newest first!)
  const addProductSale = (saleData: Omit<ProductSale, 'id' | 'remainingAmount'>): ProductSale => {
    const now = Date.now();
    const product = products.find((p) => p.id === saleData.productId);
    const client = saleData.clientId ? clients.find((c) => c.id === saleData.clientId) : undefined;
    const bankAcc = saleData.bankAccountId ? bankAccounts.find((b) => b.id === saleData.bankAccountId) : undefined;
    const bankLabel =
      saleData.bankAccountLabel ||
      (bankAcc ? `${bankAcc.bankName} - ${bankAcc.accountHolder}` : undefined);

    const safeTotal = Math.max(0, saleData.totalAmount || 0);
    const safePaid = Math.min(safeTotal, Math.max(0, saleData.paidAmount || 0));
    const remaining = Math.max(0, safeTotal - safePaid);
    const qtySuffix = (saleData.quantity || 1) > 1 ? ` × ${toPersianDigits(saleData.quantity)} واحد` : '';
    const tierSuffix = saleData.tierName ? ` — ${saleData.tierName}` : '';

    const initialEvent: ProductSaleEvent = {
      id: `evt-${now}`,
      type: 'purchase',
      date: saleData.date || getTodayPersianDate(),
      title: `خرید اولیه (${saleData.saleType}${tierSuffix}${qtySuffix})`,
      amountDelta: safeTotal,
      paidAmount: safePaid,
      method: saleData.method,
      bankAccountId: saleData.bankAccountId || undefined,
      bankAccountLabel: bankLabel,
      trackingCode: saleData.trackingCode || undefined,
      toTierName: saleData.tierName,
      supportMonthsAdded: saleData.hasSupport ? saleData.supportMonths : undefined,
      notes: saleData.notes?.trim() || undefined,
      createdTimestamp: now
    };

    const newSale: ProductSale = {
      ...saleData,
      id: `ps-${now}`,
      productName: product?.name || saleData.productName || '',
      buyerName: client ? client.name : saleData.buyerName,
      buyerCompany: client ? client.company : saleData.buyerCompany,
      totalAmount: safeTotal,
      paidAmount: safePaid,
      remainingAmount: remaining,
      bankAccountLabel: bankLabel,
      events: saleData.events && saleData.events.length > 0 ? saleData.events : [initialEvent],
      createdTimestamp: now
    };
    setProductSales((prev) => [newSale, ...prev]);
    return newSale;
  };

  const updateProductSale = (id: string, updates: Partial<ProductSale>) => {
    setProductSales((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextTotal = updates.totalAmount !== undefined ? updates.totalAmount : s.totalAmount;
        const nextPaid = updates.paidAmount !== undefined ? updates.paidAmount : s.paidAmount;
        return {
          ...s,
          ...updates,
          totalAmount: nextTotal,
          paidAmount: Math.min(nextTotal, Math.max(0, nextPaid)),
          remainingAmount: Math.max(0, nextTotal - Math.min(nextTotal, Math.max(0, nextPaid)))
        };
      })
    );
  };

  const deleteProductSale = (id: string) => {
    setProductSales((prev) => prev.filter((s) => s.id !== id));
  };

  const recordProductSalePayment = (
    saleId: string,
    amount: number,
    method: ProductSale['method'],
    bankAccountId: string,
    trackingCode?: string,
    date?: string,
    notes?: string
  ) => {
    const now = Date.now();
    const today = date || getTodayPersianDate();
    const bankAcc = bankAccounts.find((b) => b.id === bankAccountId);
    const bankLabel = bankAcc ? `${bankAcc.bankName} - ${bankAcc.accountHolder}` : undefined;

    setProductSales((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        const safeAmt = Math.min(s.remainingAmount, Math.max(0, amount));
        if (safeAmt <= 0) return s;

        const nextPaid = Math.min(s.totalAmount, s.paidAmount + safeAmt);
        const nextRem = Math.max(0, s.totalAmount - nextPaid);
        const existingEvents = getNormalizedSaleEvents(s);
        const paymentEvent: ProductSaleEvent = {
          id: `evt-pay-${now}`,
          type: 'payment',
          date: today,
          title: nextRem === 0 ? 'تسویه نهایی مانده حساب' : 'دریافت قسط / واریزی جدید',
          amountDelta: 0,
          paidAmount: safeAmt,
          method,
          bankAccountId: bankAccountId || undefined,
          bankAccountLabel: bankLabel,
          trackingCode: trackingCode?.trim() || undefined,
          notes: notes?.trim() || undefined,
          createdTimestamp: now
        };

        return {
          ...s,
          paidAmount: nextPaid,
          remainingAmount: nextRem,
          method,
          bankAccountId: bankAccountId || s.bankAccountId,
          bankAccountLabel: bankLabel || s.bankAccountLabel,
          trackingCode: trackingCode?.trim() || s.trackingCode,
          events: [paymentEvent, ...existingEvents]
        };
      })
    );
  };

  const deleteProductSaleEvent = (saleId: string, eventId: string) => {
    setProductSales((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        const existingEvents = getNormalizedSaleEvents(s);
        const targetEvt = existingEvents.find((e) => e.id === eventId);
        // Only allow deleting payment events so core purchase/upgrade/renewal audit trail remains intact
        if (!targetEvt || targetEvt.type !== 'payment') return s;

        const nextEvents = existingEvents.filter((e) => e.id !== eventId);
        const nextPaid = Math.max(0, s.paidAmount - (targetEvt.paidAmount || 0));
        const nextRem = Math.max(0, s.totalAmount - nextPaid);
        return {
          ...s,
          paidAmount: nextPaid,
          remainingAmount: nextRem,
          events: nextEvents
        };
      })
    );
  };

  const renewProductSupport = (
    saleId: string,
    months: number,
    renewalFee: number,
    method: ProductSale['method'],
    bankAccountId: string,
    trackingCode?: string,
    date?: string,
    paidAmount?: number,
    notes?: string
  ) => {
    const target = productSales.find((s) => s.id === saleId);
    if (!target) return;
    const now = Date.now();
    const today = date || getTodayPersianDate();
    const baseDate =
      target.supportEndDate && getProductSupportStatus(true, target.supportEndDate) === 'active'
        ? target.supportEndDate
        : today;
    const nextEndDate = addMonthsToPersianDate(baseDate, months);
    const bankAcc = bankAccounts.find((b) => b.id === bankAccountId);
    const bankLabel = bankAcc ? `${bankAcc.bankName} - ${bankAcc.accountHolder}` : undefined;
    const safeFee = Math.max(0, renewalFee || 0);
    const safePaid = Math.min(safeFee, Math.max(0, paidAmount !== undefined ? paidAmount : safeFee));

    // Update the SAME single ProductSale record in-place (NO duplicate row!)
    setProductSales((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        const nextTotal = s.totalAmount + safeFee;
        const nextPaid = Math.min(nextTotal, s.paidAmount + safePaid);
        const nextRem = Math.max(0, nextTotal - nextPaid);
        const existingEvents = getNormalizedSaleEvents(s);

        const renewEvent: ProductSaleEvent = {
          id: `evt-ren-${now}`,
          type: 'renewal',
          date: today,
          title: `تمدید ${toPersianDigits(months)} ماهه پشتیبانی (تا ${toPersianDigits(nextEndDate)})`,
          amountDelta: safeFee,
          paidAmount: safePaid,
          method,
          bankAccountId: bankAccountId || undefined,
          bankAccountLabel: bankLabel,
          trackingCode: trackingCode?.trim() || undefined,
          supportMonthsAdded: months,
          notes: notes?.trim() || undefined,
          createdTimestamp: now
        };

        return {
          ...s,
          hasSupport: true,
          supportMonths: months,
          supportStartDate: s.supportStartDate || today,
          supportEndDate: nextEndDate,
          supportRenewalPrice: safeFee || s.supportRenewalPrice,
          totalAmount: nextTotal,
          paidAmount: nextPaid,
          remainingAmount: nextRem,
          method: safePaid > 0 ? method : s.method,
          bankAccountId: safePaid > 0 && bankAccountId ? bankAccountId : s.bankAccountId,
          bankAccountLabel: safePaid > 0 && bankLabel ? bankLabel : s.bankAccountLabel,
          events: [renewEvent, ...existingEvents]
        };
      })
    );
  };

  const upgradeProductSaleTier = (
    saleId: string,
    targetTierId: string,
    upgradeFee: number,
    paidAmount: number,
    method: ProductSale['method'],
    bankAccountId: string,
    trackingCode?: string,
    date?: string,
    notes?: string
  ) => {
    const target = productSales.find((s) => s.id === saleId);
    if (!target) return;
    const product = products.find((p) => p.id === target.productId);
    const nextTier = product?.tiers?.find((t) => t.id === targetTierId);
    if (!nextTier) return;

    const now = Date.now();
    const today = date || getTodayPersianDate();
    const bankAcc = bankAccounts.find((b) => b.id === bankAccountId);
    const bankLabel = bankAcc ? `${bankAcc.bankName} - ${bankAcc.accountHolder}` : undefined;
    const safeFee = Math.max(0, upgradeFee || 0);
    const safePaid = Math.min(safeFee, Math.max(0, paidAmount || 0));
    const previousTierName = target.tierName || 'نسخه قبلی';

    // Update the SAME single ProductSale record in-place (NO duplicate row!)
    setProductSales((prev) =>
      prev.map((s) => {
        if (s.id !== saleId) return s;
        const nextTotal = s.totalAmount + safeFee;
        const nextPaid = Math.min(nextTotal, s.paidAmount + safePaid);
        const nextRem = Math.max(0, nextTotal - nextPaid);
        const existingEvents = getNormalizedSaleEvents(s);

        const upgradeEvent: ProductSaleEvent = {
          id: `evt-upg-${now}`,
          type: 'upgrade',
          date: today,
          title: `ارتقای نسخه از «${previousTierName}» به «${nextTier.name}»`,
          amountDelta: safeFee,
          paidAmount: safePaid,
          method: safePaid > 0 ? method : undefined,
          bankAccountId: safePaid > 0 && bankAccountId ? bankAccountId : undefined,
          bankAccountLabel: safePaid > 0 && bankLabel ? bankLabel : undefined,
          trackingCode: trackingCode?.trim() || undefined,
          fromTierName: previousTierName,
          toTierName: nextTier.name,
          notes: notes?.trim() || undefined,
          createdTimestamp: now
        };

        return {
          ...s,
          tierId: nextTier.id,
          tierName: nextTier.name,
          upgradedFromTierName: previousTierName,
          unitPrice: nextTier.price, // Keep unitPrice synced so future upgrades compute diff accurately!
          totalAmount: nextTotal,
          paidAmount: nextPaid,
          remainingAmount: nextRem,
          supportRenewalPrice:
            nextTier.supportRenewalPrice !== undefined
              ? nextTier.supportRenewalPrice
              : s.supportRenewalPrice,
          method: safePaid > 0 ? method : s.method,
          bankAccountId: safePaid > 0 && bankAccountId ? bankAccountId : s.bankAccountId,
          bankAccountLabel: safePaid > 0 && bankLabel ? bankLabel : s.bankAccountLabel,
          events: [upgradeEvent, ...existingEvents]
        };
      })
    );
  };

  // Convert an existing custom Project into a reusable Product with zero financial double-counting
  const convertProjectToProduct = (params: {
    projectId: string;
    productName: string;
    domain: string;
    description?: string;
    salesModel: ProductSalesModel;
    oneTimePrice?: number;
    monthlyPrice?: number;
    annualPrice?: number;
    tiers?: ProductTier[];
    supportPolicy: ProductSupportPolicy;
    defaultSupportMonths: number;
    supportRenewalPrice?: number;
    productizationCost?: number;
    includeFounderInSupport: boolean;
    founderTierId?: string;
    founderSupportMonths?: number;
    founderSupportStartDate?: string;
  }): Product | null => {
    const project = projects.find((p) => p.id === params.projectId);
    if (!project) return null;

    const now = Date.now();
    const today = getTodayPersianDate();
    const cleanTiers = params.tiers && params.tiers.length > 0 ? params.tiers : undefined;
    const defaultOneTime =
      params.oneTimePrice ||
      (cleanTiers ? cleanTiers[0]?.price : 0) ||
      0;

    const newProduct: Product = {
      id: `prod-${now}`,
      name: params.productName.trim() || project.title,
      domain: params.domain || productDomains[0] || 'نرم‌افزار ابری (SaaS)',
      description: params.description?.trim() || project.description || undefined,
      stack: project.stack || [],
      status: 'آماده فروش',
      salesModel: params.salesModel,
      oneTimePrice: params.salesModel === 'subscription' ? 0 : defaultOneTime,
      monthlyPrice: params.salesModel === 'one-time' ? 0 : params.monthlyPrice || 0,
      annualPrice: params.salesModel === 'one-time' ? 0 : params.annualPrice || 0,
      tiers: cleanTiers,
      variableCostPerUnit: 0,
      targetMarginPercent: 100,
      targetSalesCount: 10,
      supportPolicy: params.supportPolicy,
      defaultSupportMonths: params.defaultSupportMonths || 12,
      supportRenewalPrice: params.supportRenewalPrice || 0,
      demoUrl: project.liveUrl || undefined,
      version: '1.0',
      sourceProjectId: project.id,
      sourceProjectTitle: project.title,
      createdAt: today,
      createdTimestamp: now
    };

    // 1. Add new Product
    setProducts((prev) => [newProduct, ...prev]);

    // 2. Link Project -> Product (keeping all original project revenue & costs untouched!)
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, convertedProductId: newProduct.id } : p))
    );

    // 3. Optional extra productization cost (ONLY new cost to generalize the project, never duplicates project costs)
    const extraCost = Math.max(0, params.productizationCost || 0);
    if (extraCost > 0) {
      const costItem: ProductCostItem = {
        id: `pc-${now + 1}`,
        productId: newProduct.id,
        productName: newProduct.name,
        costType: 'توسعه اولیه',
        title: `هزینه عمومی‌سازی و تبدیل پروژه «${project.title}» به محصول`,
        amount: extraCost,
        date: today,
        paymentStatus: 'paid',
        notes: 'هزینه مازاد برای پکیج‌سازی و آماده‌سازی محصول جهت فروش عمومی',
        createdTimestamp: now + 1
      };
      setProductCosts((prev) => [costItem, ...prev]);
    }

    // 4. Optional Founder License enrollment (0 Toman so zero revenue double-counting, active in Support & Upgrade flows!)
    if (params.includeFounderInSupport) {
      const client = clients.find((c) => c.id === project.clientId);
      const selectedTier = cleanTiers?.find((t) => t.id === params.founderTierId) || cleanTiers?.[0];
      const supportMonths = Math.max(
        1,
        params.founderSupportMonths || selectedTier?.supportMonths || params.defaultSupportMonths || 12
      );
      const startDate = params.founderSupportStartDate || project.deadline || today;
      const endDate = addMonthsToPersianDate(startDate, supportMonths);
      const renewalPrice =
        selectedTier?.supportRenewalPrice ?? params.supportRenewalPrice ?? 0;

      const founderEvent: ProductSaleEvent = {
        id: `evt-fnd-${now + 2}`,
        type: 'purchase',
        date: startDate,
        title: `ثبت لایسنس مشتری بنیان‌گذار (پروژه «${project.title}»)`,
        amountDelta: 0,
        paidAmount: 0,
        toTierName: selectedTier?.name,
        supportMonthsAdded: supportMonths,
        notes: 'هزینه ساخت اولیه در بخش پروژه‌ها ثبت شده است (مبلغ ۰ برای جلوگیری از دوباره‌شماری مالی). تمدیدهای آتی و ارتقای نسخه از این پرونده ثبت می‌شوند.',
        createdTimestamp: now + 2
      };

      const founderSale: ProductSale = {
        id: `ps-fnd-${now + 2}`,
        productId: newProduct.id,
        productName: newProduct.name,
        clientId: client?.id || project.clientId,
        buyerName: client?.name || project.clientName || 'مشتری اولیه',
        buyerCompany: client?.company,
        saleType: 'یک‌باره',
        tierId: selectedTier?.id,
        tierName: selectedTier?.name,
        quantity: 1,
        unitPrice: selectedTier?.price || defaultOneTime || 0,
        discount: selectedTier?.price || defaultOneTime || 0,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        date: startDate,
        method: 'شبا / پایا',
        hasSupport: true,
        supportMonths,
        supportStartDate: startDate,
        supportEndDate: endDate,
        supportRenewalPrice: renewalPrice,
        isFounderLicense: true,
        notes: `مشتری بنیان‌گذار — تبدیل‌شده از پروژه «${project.title}» (بدون دوباره‌شماری درآمد)`,
        events: [founderEvent],
        createdTimestamp: now + 2
      };

      setProductSales((prev) => [founderSale, ...prev]);
    }

    return newProduct;
  };

  // Bank Account CRUD
  const addBankAccount = (account: Omit<BankAccount, 'id'>): BankAccount => {
    const newAcc: BankAccount = { ...account, id: `bank-${Date.now()}` };
    setBankAccounts((prev) => {
      const cleaned = account.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      return [newAcc, ...cleaned];
    });
    return newAcc;
  };

  const updateBankAccount = (id: string, updates: Partial<BankAccount>) => {
    setBankAccounts((prev) =>
      prev.map((a) => {
        if (a.id === id) return { ...a, ...updates };
        if (updates.isDefault) return { ...a, isDefault: false };
        return a;
      })
    );
  };

  const deleteBankAccount = (id: string) => {
    if (bankAccounts.length <= 1) return;
    setBankAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  // User CRUD
  const addUser = (userData: Omit<SystemUser, 'id' | 'createdAt'>): SystemUser => {
    const newUser: SystemUser = {
      ...userData,
      id: `u-${Date.now()}`,
      createdAt: getTodayPersianDate()
    };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<SystemUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteUser = (id: string) => {
    if (users.length <= 1 || id === currentUser?.id) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const changeCurrentUserPassword = (currentPassword: string, newPassword: string) => {
    if (!currentUser) {
      return { ok: false, message: 'کاربر فعال یافت نشد.' };
    }
    if (currentUser.password !== currentPassword) {
      return { ok: false, message: 'رمز عبور فعلی نادرست است.' };
    }
    if (newPassword.trim().length < 4) {
      return { ok: false, message: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' };
    }
    updateUser(currentUser.id, { password: newPassword.trim() });
    return { ok: true, message: 'رمز عبور شما با موفقیت تغییر یافت.' };
  };

  // Analytical stats helper for a specific client
  const getClientStats = (clientId: string) => {
    const clientProjects = projects.filter((p) => p.clientId === clientId);
    const clientPayments = payments.filter(
      (p) => p.clientId === clientId || clientProjects.some((cp) => cp.id === p.projectId)
    );
    const clientExpenses = expenses.filter(
      (e) => e.clientId === clientId || clientProjects.some((cp) => cp.id === e.projectId)
    );

    const totalContractValue = clientProjects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
    const totalPaid = clientPayments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingDebt = Math.max(0, totalContractValue - totalPaid);
    const totalExpenses = clientExpenses.reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
    const paidExpenses = clientExpenses
      .filter((e) => e.paymentStatus !== 'pending')
      .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
    const netProfit = totalContractValue - totalExpenses;
    const cashNetProfit = totalPaid - paidExpenses;
    const activeProjectCount = clientProjects.filter(
      (p) => p.status === ProjectStatus.Active || p.status === ProjectStatus.Testing
    ).length;

    const clientProductSales = productSales.filter((s) => s.clientId === clientId);
    const totalProductSpend = clientProductSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const productRemainingDebt = clientProductSales.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

    return {
      projectCount: clientProjects.length,
      activeProjectCount,
      totalContractValue,
      totalPaid,
      remainingDebt,
      totalExpenses,
      paidExpenses,
      netProfit,
      cashNetProfit,
      projects: clientProjects,
      payments: clientPayments,
      expenses: clientExpenses,
      productSales: clientProductSales,
      totalProductSpend,
      productRemainingDebt
    };
  };

  // Analytical stats helper for a specific project
  const getProjectStats = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const projectPayments = payments.filter((p) => p.projectId === projectId);
    const projectExpenses = expenses.filter((e) => e.projectId === projectId);
    const projectServers = servers.filter((s) => s.projectId === projectId);
    const projectDomains = domains.filter((d) => d.projectId === projectId);
    const projectTasks = tasks.filter((t) => t.projectId === projectId);

    const contractValue = project?.contractValue || 0;
    const totalPaid = projectPayments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const remainingBalance = Math.max(0, contractValue - totalPaid);
    const totalExpenses = projectExpenses.reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
    const paidExpenses = projectExpenses
      .filter((e) => e.paymentStatus !== 'pending')
      .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
    const pendingExpenses = projectExpenses
      .filter((e) => e.paymentStatus === 'pending')
      .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);

    const commissionExpenses = projectExpenses
      .filter((e) => e.type === 'commission')
      .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
    const infraExpenses = projectExpenses
      .filter((e) => e.type !== 'commission' && e.type !== 'other')
      .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
    const otherExpenses = projectExpenses
      .filter((e) => e.type === 'other')
      .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);

    // Contract-based net profit = Contract Value - Total Project Expenses
    const netProfit = contractValue - totalExpenses;
    // Cash-based net profit = Cash Received - Paid Project Expenses
    const cashNetProfit = totalPaid - paidExpenses;
    const paidPercentage = contractValue > 0 ? Math.min(100, Math.round((totalPaid / contractValue) * 100)) : 0;

    return {
      contractValue,
      totalPaid,
      remainingBalance,
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      commissionExpenses,
      infraExpenses,
      otherExpenses,
      netProfit,
      cashNetProfit,
      paidPercentage,
      expenses: projectExpenses,
      payments: projectPayments,
      servers: projectServers,
      domains: projectDomains,
      tasks: projectTasks
    };
  };

  // Analytical stats helper for a specific Product (Cost, Margin, Break-Even, ROI, Support)
  const getProductStats = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const costs = productCosts
      .filter((c) => c.productId === productId)
      .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
    const sales = productSales
      .filter((s) => s.productId === productId)
      .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));

    const totalCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
    const paidCost = costs
      .filter((c) => c.paymentStatus !== 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    const pendingCost = costs
      .filter((c) => c.paymentStatus === 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    const devCost = costs.filter((c) => c.costType === 'توسعه اولیه').reduce((s, c) => s + c.amount, 0);
    const infraCost = costs.filter((c) => c.costType === 'نگهداری و زیرساخت').reduce((s, c) => s + c.amount, 0);
    const marketingCost = costs.filter((c) => c.costType === 'بازاریابی و فروش').reduce((s, c) => s + c.amount, 0);
    const otherCost = costs.filter((c) => c.costType === 'سایر').reduce((s, c) => s + c.amount, 0);

    const coreSales = sales.filter(
      (s) => s.saleType !== 'تمدید پشتیبانی' && s.saleType !== 'ارتقای نسخه'
    );
    const commercialCoreSales = coreSales.filter(
      (s) => !s.isFounderLicense || (s.totalAmount || 0) > 0
    );
    const salesCount = commercialCoreSales.length;
    const totalUnitsSold = commercialCoreSales.reduce((sum, s) => sum + (s.quantity || 1), 0);
    const totalSalesValue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const remainingReceivables = sales.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

    const varCostPerUnit = product?.variableCostPerUnit || 0;
    const totalVariableCost = totalUnitsSold * varCostPerUnit;

    const netProfit = totalSalesValue - totalCost - totalVariableCost;
    const cashNetProfit = totalPaid - paidCost - totalVariableCost;
    const totalInvestment = totalCost + totalVariableCost;
    const roiPercent = totalInvestment > 0 ? Math.round((netProfit / totalInvestment) * 100) : 0;

    const tiersList = product?.tiers && product.tiers.length > 0 ? product.tiers : [];
    const avgTierPrice =
      tiersList.length > 0
        ? Math.round(tiersList.reduce((sum, t) => sum + (t.price || 0), 0) / tiersList.length)
        : 0;

    // Reference price for simulator & break-even calculations
    const referenceUnitPrice =
      product?.salesModel === 'subscription'
        ? product?.annualPrice || product?.monthlyPrice || avgTierPrice || 0
        : product?.oneTimePrice || avgTierPrice || product?.annualPrice || product?.monthlyPrice || 0;

    const unitNetContribution = Math.max(0, referenceUnitPrice - varCostPerUnit);
    const targetSales = Math.max(1, product?.targetSalesCount || 10);
    const pricingMode = product?.pricingMode || 'markup';
    const rawTargetPercent = Math.max(0, product?.targetMarginPercent ?? 60);
    const unitFixedCost = totalCost > 0 ? Math.round(totalCost / targetSales) : 0;
    const unitTotalCost = unitFixedCost + varCostPerUnit;
    const suggestedPriceByMargin =
      unitTotalCost > 0
        ? pricingMode === 'margin'
          ? Math.round(unitTotalCost / Math.max(0.1, 1 - Math.min(90, rawTargetPercent) / 100))
          : Math.round(unitTotalCost * (1 + rawTargetPercent / 100))
        : referenceUnitPrice;
    const actualMarginPercent =
      referenceUnitPrice > 0
        ? Math.round(((referenceUnitPrice - varCostPerUnit) / referenceUnitPrice) * 100)
        : 0;

    const breakEvenUnits =
      totalCost > 0 && unitNetContribution > 0 ? Math.ceil(totalCost / unitNetContribution) : 0;
    const remainingUnitsToBreakEven = Math.max(0, breakEvenUnits - totalUnitsSold);
    const breakEvenProgressPercent =
      totalCost > 0
        ? Math.min(100, Math.round((Math.max(0, totalSalesValue - totalVariableCost) / totalCost) * 100))
        : totalSalesValue > 0
        ? 100
        : 0;
    const isProfitable = netProfit >= 0 && totalSalesValue > 0;

    // Support counts (on non-renewal base sales records)
    let activeSupportCount = 0;
    let expiringSupportCount = 0;
    let expiredSupportCount = 0;
    coreSales.forEach((s) => {
      const st = getProductSupportStatus(s.hasSupport, s.supportEndDate);
      if (st === 'active') activeSupportCount += 1;
      else if (st === 'expiring') expiringSupportCount += 1;
      else if (st === 'expired') expiredSupportCount += 1;
    });

    return {
      totalCost,
      paidCost,
      pendingCost,
      devCost,
      infraCost,
      marketingCost,
      otherCost,
      salesCount,
      totalUnitsSold,
      totalSalesValue,
      totalPaid,
      remainingReceivables,
      totalVariableCost,
      netProfit,
      cashNetProfit,
      roiPercent,
      referenceUnitPrice,
      unitNetContribution,
      suggestedPriceByMargin,
      actualMarginPercent,
      breakEvenUnits,
      remainingUnitsToBreakEven,
      breakEvenProgressPercent,
      isProfitable,
      activeSupportCount,
      expiringSupportCount,
      expiredSupportCount,
      costs,
      sales
    };
  };

  // Overall Financial Summary (Combined Projects + Products AND Clean Splits!)
  const projectsRevenue = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
  const projectsPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const projectsExpenses = expenses.reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
  const projectsPaidExpenses = expenses
    .filter((e) => e.paymentStatus !== 'pending')
    .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
  const projectsPendingExpenses = expenses
    .filter((e) => e.paymentStatus === 'pending')
    .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
  const projectsPendingReceivables = projects.reduce((sum, p) => {
    const pPaid = payments
      .filter((pay) => pay.projectId === p.id && pay.status === 'completed')
      .reduce((s, pay) => s + pay.amount, 0);
    return sum + Math.max(0, (p.contractValue || 0) - pPaid);
  }, 0);
  const projectsNetProfit = projectsRevenue - projectsExpenses;

  const productsRevenue = productSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const productsPaid = productSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const productsCosts = productCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
  const productsPaidCosts = productCosts
    .filter((c) => c.paymentStatus !== 'pending')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const productsPendingCosts = productCosts
    .filter((c) => c.paymentStatus === 'pending')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const productsPendingReceivables = productSales.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);
  const productsNetProfit = productsRevenue - productsCosts;
  const productsSalesCount = productSales.filter(
    (s) =>
      s.saleType !== 'تمدید پشتیبانی' &&
      s.saleType !== 'ارتقای نسخه' &&
      (!s.isFounderLicense || (s.totalAmount || 0) > 0)
  ).length;
  const activeProductSupports = productSales
    .filter((s) => s.saleType !== 'تمدید پشتیبانی' && s.saleType !== 'ارتقای نسخه')
    .filter((s) => {
      const st = getProductSupportStatus(s.hasSupport, s.supportEndDate);
      return st === 'active' || st === 'expiring';
    }).length;

  const totalRevenue = projectsRevenue + productsRevenue;
  const totalPaid = projectsPaid + productsPaid;
  const totalExpenses = projectsExpenses + productsCosts;
  const paidExpenses = projectsPaidExpenses + productsPaidCosts;
  const pendingExpenses = projectsPendingExpenses + productsPendingCosts;

  const totalCommissions = expenses
    .filter((e) => e.type === 'commission')
    .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
  const totalInfra = expenses
    .filter((e) => e.type !== 'commission' && e.type !== 'other')
    .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);
  const totalOtherExpenses = expenses
    .filter((e) => e.type === 'other')
    .reduce((sum, e) => sum + (e.purchaseCost || 0), 0);

  const netProfit = totalRevenue - totalExpenses;
  const cashNetProfit = totalPaid - paidExpenses;
  const pendingReceivables = projectsPendingReceivables + productsPendingReceivables;

  const financeSummary: FinanceSummary = {
    totalRevenue,
    totalPaid,
    totalExpenses,
    paidExpenses,
    pendingExpenses,
    totalCommissions,
    totalInfra,
    totalOtherExpenses,
    netProfit,
    cashNetProfit,
    pendingReceivables,
    projectsRevenue,
    projectsPaid,
    projectsExpenses,
    projectsNetProfit,
    projectsPendingReceivables,
    productsRevenue,
    productsPaid,
    productsCosts,
    productsNetProfit,
    productsPendingReceivables,
    productsSalesCount,
    activeProductSupports
  };

  const topClients = clients
    .map((client) => {
      const stats = getClientStats(client.id);
      return {
        client,
        totalSpent: stats.totalPaid + stats.totalProductSpend,
        totalContractValue: stats.totalContractValue,
        totalNetProfit: stats.netProfit,
        projectCount: stats.projectCount,
        remainingDebt: stats.remainingDebt + stats.productRemainingDebt
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const exportBackup = () => {
    const data = {
      clients,
      projects,
      payments,
      expenses,
      servers,
      domains,
      tasks,
      products,
      productCosts,
      productSales,
      clientStatuses,
      projectStatuses,
      projectCategories,
      techStacks,
      expenseCategories,
      expenseTypes,
      productCostTypes,
      productDomains,
      bankAccounts,
      users,
      invoices,
      invoiceSellerProfile,
      exportDate: getTodayPersianDate(),
      version: '3.0'
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shayegan_manager_backup_${getTodayPersianDate().replace(/\//g, '-')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importBackup = (jsonDataString: string): boolean => {
    try {
      const data = JSON.parse(jsonDataString);
      if (!data || typeof data !== 'object') return false;
      if (data.clients) setClients(data.clients);
      if (data.projects) setProjects(data.projects);
      if (data.payments) setPayments(data.payments);
      if (data.expenses) setExpenses(data.expenses);
      if (data.servers) setServers(data.servers);
      if (data.domains) setDomains(data.domains);
      if (data.tasks) setTasks(data.tasks);
      if (data.products) setProducts(data.products);
      if (data.productCosts) setProductCosts(data.productCosts);
      if (data.productSales) setProductSales(data.productSales);
      if (data.invoices) setInvoices(data.invoices);
      if (data.invoiceSellerProfile) setInvoiceSellerProfile(data.invoiceSellerProfile);
      if (data.bankAccounts) setBankAccounts(data.bankAccounts);
      if (data.users) setUsers(data.users);
      if (data.clientStatuses) setClientStatuses(data.clientStatuses);
      if (data.projectStatuses) setProjectStatuses(data.projectStatuses);
      if (data.projectCategories) setProjectCategories(data.projectCategories);
      if (data.techStacks) setTechStacks(data.techStacks);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      if (data.expenseTypes) setExpenseTypes(data.expenseTypes);
      if (data.productCostTypes) setProductCostTypes(data.productCostTypes);
      if (data.productDomains) setProductDomains(data.productDomains);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        clients,
        projects,
        payments,
        expenses,
        servers,
        domains,
        tasks,
        products,
        productCosts,
        productSales,
        clientStatuses,
        projectStatuses,
        projectCategories,
        techStacks,
        expenseCategories,
        expenseTypes,
        productCostTypes,
        productDomains,
        bankAccounts,
        users,
        currentUser,
        invoices,
        invoiceSellerProfile,
        activeTab,
        setActiveTab,
        navResetCount,
        navigateToMenuTab,
        selectedProjectIdForView,
        setSelectedProjectIdForView,
        selectedClientIdForView,
        setSelectedClientIdForView,
        selectedProductIdForView,
        setSelectedProductIdForView,
        invoiceDraftForBuilder,
        setInvoiceDraftForBuilder,
        exportBackup,
        importBackup,
        addClient,
        updateClient,
        deleteClient,
        addClientInteraction,
        addProject,
        updateProject,
        deleteProject,
        toggleMilestone,
        addMilestone,
        addPayment,
        updatePayment,
        deletePayment,
        addExpense,
        updateExpense,
        deleteExpense,
        addServer,
        updateServer,
        deleteServer,
        addDomain,
        updateDomain,
        deleteDomain,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        addClientStatus,
        updateClientStatus,
        deleteClientStatus,
        addProjectStatus,
        updateProjectStatus,
        deleteProjectStatus,
        addProjectCategory,
        updateProjectCategory,
        deleteProjectCategory,
        addTechStack,
        updateTechStack,
        deleteTechStack,
        addExpenseCategory,
        updateExpenseCategory,
        deleteExpenseCategory,
        addExpenseType,
        updateExpenseType,
        deleteExpenseType,
        addProductCostType,
        updateProductCostType,
        deleteProductCostType,
        addProductDomain,
        updateProductDomain,
        deleteProductDomain,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updateInvoiceSellerProfile,
        buildInvoiceFromProject,
        buildInvoiceFromProductSale,
        addProduct,
        updateProduct,
        deleteProduct,
        addProductCost,
        updateProductCost,
        deleteProductCost,
        addProductSale,
        updateProductSale,
        deleteProductSale,
        recordProductSalePayment,
        deleteProductSaleEvent,
        renewProductSupport,
        upgradeProductSaleTier,
        convertProjectToProduct,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        addUser,
        updateUser,
        deleteUser,
        changeCurrentUserPassword,
        getClientStats,
        getProjectStats,
        getProductStats,
        financeSummary,
        topClients
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
