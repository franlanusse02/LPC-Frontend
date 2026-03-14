module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/backend/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
const API_URL = "http://10.0.0.50";
const TARGETS = [
    API_URL,
    `${API_URL}:8080`
];
const dynamic = "force-dynamic";
const runtime = "nodejs";
async function proxy(request, context) {
    const { path } = await context.params;
    const pathname = path.join("/");
    const search = request.nextUrl.search;
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    let lastError = null;
    for (const target of TARGETS){
        try {
            const response = await fetch(`${target}/api/${pathname}${search}`, {
                method: request.method,
                headers: buildHeaders(request),
                body,
                cache: "no-store",
                signal: AbortSignal.timeout(5000)
            });
            return new Response(response.body, {
                status: response.status,
                headers: buildResponseHeaders(response)
            });
        } catch (error) {
            lastError = error;
        }
    }
    const message = lastError instanceof Error ? lastError.message : "No se pudo conectar con el backend";
    return Response.json({
        message: `No se pudo conectar con el backend (${message})`
    }, {
        status: 502
    });
}
function buildHeaders(request) {
    const headers = new Headers();
    const authorization = request.headers.get("authorization");
    const contentType = request.headers.get("content-type");
    if (authorization) {
        headers.set("Authorization", authorization);
    }
    if (contentType) {
        headers.set("Content-Type", contentType);
    }
    return headers;
}
function buildResponseHeaders(response) {
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) {
        headers.set("Content-Type", contentType);
    }
    return headers;
}
async function GET(request, context) {
    return proxy(request, context);
}
async function POST(request, context) {
    return proxy(request, context);
}
async function DELETE(request, context) {
    return proxy(request, context);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e33a6801._.js.map