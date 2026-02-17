// src/app/core/config/config.ts

export const APP_CONFIG = {
    BASE_URL: 'http://localhost:8080',
    // BASE_URL: 'https://school-app-backend-production.up.railway.app',
    //   apiUrl: 'https://school-app-backend-production.up.railway.app'


    API: {
        AUTH: '/api/auth',
        USERS: '/api/users',
        ADMIN: '/api/admin',
        PRODUCTS: '/api/products',
        EMPLOYEES: '/api/employees',
        CUSTOMER_TRN: '/api/customer-trn',
        BATCH: '/api/batch',
        KM_BATCH: '/api/km-batch',
        KM_ENTRY: '/api/km-entry',
        LOCATION: '/api/location',
        ROOTS: '/api/roots',
        RECEIPTS: '/api/receipts',
        PARTY_PRICES: '/api/party-prices',
        FILE_UPLOAD: '/api/files/upload',
        PROJECTS: '/api/projects',
        LEADS: '/api/leads',
        INQUIRIES: '/api/inquiries',
        INQUIRY_SCHEDULE: '/api/inquiry-schedule',
        CASTING_REPORT: '/api/casting-report',
        PRODUCTION: '/api/production',
        WIRE_CUTTING: '/api/wire-cutting',
        AUTOCLAVE: '/api/autoclave',
        BLOCK_SEPARATING: '/api/block-separating',
        CUBE_TEST: '/cube-test',
        REJECTION: '/api/rejection',
        PRODUCTION_DASHBOARD: '/api/productiondashboard'
    }
};
