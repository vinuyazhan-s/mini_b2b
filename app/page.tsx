"use client";

import React, { useState, useEffect } from "react";
import { Building2, ShoppingBag, FileText, Plus, Printer, CheckCircle, Trash2 } from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  moq: number;
  gstRate: number;
};

type QuoteRequest = {
  id: string;
  buyerCompany: string;
  buyerGstin: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  gstRate: number;
  status: "Pending Quote" | "Proforma Sent";
  proforma?: {
    invoiceNo: string;
    discountPct: number;
    freight: number;
    incoterm: string;
    subtotal: number;
    discountAmt: number;
    taxAmt: number;
    grandTotal: number;
    notes: string;
  };
};

const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", name: "Industrial Corrugated Boxes (Bundle of 100)", sku: "PKG-101", unitPrice: 2400, moq: 10, gstRate: 18 },
  { id: "p2", name: "Grade-A Stainless Steel Fasteners (Box)", sku: "HRD-204", unitPrice: 1850, moq: 20, gstRate: 18 },
  { id: "p3", name: "Organic Cotton Woven Fabric Roll (50m)", sku: "TXT-309", unitPrice: 6500, moq: 5, gstRate: 5 },
];

export default function B2BPortal() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);

  // Buyer RFQ state
  const [buyerCompany, setBuyerCompany] = useState("Apex Traders Pvt Ltd");
  const [buyerGstin, setBuyerGstin] = useState("33AABCA1234F1Z5");
  const [selectedProdId, setSelectedProdId] = useState("p1");
  const [reqQty, setReqQty] = useState(15);

  // Seller New Product state
  const [newProdName, setNewProdName] = useState("");
  const [newProdSku, setNewProdSku] = useState("");
  const [newProdPrice, setNewProdPrice] = useState(1000);
  const [newProdMoq, setNewProdMoq] = useState(10);
  const [newProdGst, setNewProdGst] = useState(18);

  // Seller Proforma Calculator state
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [calcPrice, setCalcPrice] = useState(0);
  const [calcQty, setCalcQty] = useState(0);
  const [calcDiscount, setCalcDiscount] = useState(5);
  const [calcGst, setCalcGst] = useState(18);
  const [calcFreight, setCalcFreight] = useState(1200);
  const [calcIncoterm, setCalcIncoterm] = useState("EXW (Ex-Works)");
  const [calcNotes, setCalcNotes] = useState("50% advance payment. Valid for 7 business days.");

  // Load saved data from localStorage
  useEffect(() => {
    const savedProds = localStorage.getItem("b2b_products");
    const savedQuotes = localStorage.getItem("b2b_quotes");
    if (savedProds) setProducts(JSON.parse(savedProds));
    if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
  }, []);

  useEffect(() => {
    localStorage.setItem("b2b_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("b2b_quotes", JSON.stringify(quotes));
  }, [quotes]);

  // Buyer submits Request for Quote (RFQ)
  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;
    const newQuote: QuoteRequest = {
      id: "RFQ-" + Math.floor(1000 + Math.random() * 9000),
      buyerCompany,
      buyerGstin,
      productId: prod.id,
      productName: prod.name,
      qty: Math.max(reqQty, prod.moq),
      unitPrice: prod.unitPrice,
      gstRate: prod.gstRate,
      status: "Pending Quote",
    };
    setQuotes([newQuote, ...quotes]);
    alert(`RFQ ${newQuote.id} sent to Seller! Switch to Seller Portal to generate the Proforma Invoice.`);
  };

  // Seller adds product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku) return;
    setProducts([
      ...products,
      {
        id: "p-" + Date.now(),
        name: newProdName,
        sku: newProdSku,
        unitPrice: Number(newProdPrice),
        moq: Number(newProdMoq),
        gstRate: Number(newProdGst),
      },
    ]);
    setNewProdName("");
    setNewProdSku("");
  };

  // Open Proforma Calculator for a Quote
  const openCalculator = (q: QuoteRequest) => {
    setActiveQuoteId(q.id);
    setCalcPrice(q.unitPrice);
    setCalcQty(q.qty);
    setCalcGst(q.gstRate);
    setCalcDiscount(q.proforma?.discountPct ?? 5);
    setCalcFreight(q.proforma?.freight ?? 1200);
    setCalcIncoterm(q.proforma?.incoterm ?? "EXW (Ex-Works)");
  };

  // Live Proforma Math
  const subtotal = calcPrice * calcQty;
  const discountAmt = (subtotal * calcDiscount) / 100;
  const taxableValue = subtotal - discountAmt + Number(calcFreight);
  const taxAmt = (taxableValue * calcGst) / 100;
  const grandTotal = taxableValue + taxAmt;

  const handleSaveProforma = () => {
    if (!activeQuoteId) return;
    setQuotes(
      quotes.map((q) =>
        q.id === activeQuoteId
          ? {
              ...q,
              unitPrice: calcPrice,
              qty: calcQty,
              gstRate: calcGst,
              status: "Proforma Sent",
              proforma: {
                invoiceNo: "PI-" + new Date().getFullYear() + "-" + q.id.split("-")[1],
                discountPct: calcDiscount,
                freight: Number(calcFreight),
                incoterm: calcIncoterm,
                subtotal,
                discountAmt,
                taxAmt,
                grandTotal,
                notes: calcNotes,
              },
            }
          : q
      )
    );
    setActiveQuoteId(null);
  };

  const resetDemo = () => {
    localStorage.removeItem("b2b_products");
    localStorage.removeItem("b2b_quotes");
    setProducts(INITIAL_PRODUCTS);
    setQuotes([]);
    setActiveQuoteId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-lg tracking-tight">TradeFlow B2B</span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Local Edition</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setRole("buyer")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              role === "buyer" ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"
            }`}
          >
            Buyer Portal
          </button>
          <button
            onClick={() => setRole("seller")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              role === "seller" ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"
            }`}
          >
            Seller Portal ({quotes.filter((q) => q.status === "Pending Quote").length} Pending)
          </button>
        </div>

        <button onClick={resetDemo} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1">
          <Trash2 className="w-3.5 h-3.5" /> Reset Data
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* ================= BUYER PORTAL ================= */}
        {role === "buyer" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Product Catalog */}
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" /> Wholesale Product Catalog
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Base Price</th>
                        <th className="p-3">MOQ</th>
                        <th className="p-3">GST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs">{p.sku}</td>
                          <td className="p-3 font-medium">{p.name}</td>
                          <td className="p-3">₹{p.unitPrice.toLocaleString()}</td>
                          <td className="p-3">{p.moq} units</td>
                          <td className="p-3">{p.gstRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Request For Quote Form */}
              <form onSubmit={handleRequestQuote} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold">Request Bulk Quote (RFQ)</h2>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Buyer Company Name</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Buyer GSTIN</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    value={buyerGstin}
                    onChange={(e) => setBuyerGstin(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Product</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (MOQ: {p.moq})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Order Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={reqQty}
                    onChange={(e) => setReqQty(Number(e.target.value))}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                >
                  Send RFQ to Seller
                </button>
              </form>
            </div>

            {/* Buyer Sent RFQs & Received Proforma Invoices */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">My Quote Requests & Received Proforma Invoices</h2>
              {quotes.length === 0 ? (
                <p className="text-sm text-slate-500">No RFQs submitted yet. Submit one above!</p>
              ) : (
                <div className="space-y-4">
                  {quotes.map((q) => (
                    <div key={q.id} className="border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{q.id}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              q.status === "Proforma Sent"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {q.productName} — <span className="text-slate-600">{q.qty} units</span>
                        </p>
                      </div>

                      {q.proforma && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm min-w-[260px]">
                          <div className="flex justify-between font-bold text-emerald-700">
                            <span>{q.proforma.invoiceNo}</span>
                            <span>₹{q.proforma.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Incoterm: {q.proforma.incoterm} • Discount: {q.proforma.discountPct}% • Freight: ₹{q.proforma.freight}
                          </p>
                          <button
                            onClick={() => window.print()}
                            className="mt-2 text-xs bg-slate-900 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-slate-700 print:hidden"
                          >
                            <Printer className="w-3 h-3" /> Print / Save PDF
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SELLER PORTAL ================= */}
        {role === "seller" && (
          <div className="space-y-8">
            {/* Proforma Invoice Calculator Modal/Panel */}
            {activeQuoteId && (
              <div className="bg-white p-6 rounded-xl border-2 border-emerald-500 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-800">
                    <FileText className="w-5 h-5" /> Proforma Invoice Calculator ({activeQuoteId})
                  </h2>
                  <button onClick={() => setActiveQuoteId(null)} className="text-sm text-slate-500 hover:text-slate-800">
                    Cancel
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Negotiated Unit Price (₹)</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={calcPrice}
                      onChange={(e) => setCalcPrice(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={calcQty}
                      onChange={(e) => setCalcQty(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bulk Discount (%)</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={calcDiscount}
                      onChange={(e) => setCalcDiscount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Freight & Packaging (₹)</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={calcFreight}
                      onChange={(e) => setCalcFreight(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">GST Rate (%)</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={calcGst}
                      onChange={(e) => setCalcGst(Number(e.target.value))}
                    >
                      <option value={0}>0% (Export / Exempt)</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Incoterm / Delivery</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={calcIncoterm}
                      onChange={(e) => setCalcIncoterm(e.target.value)}
                    >
                      <option>EXW (Ex-Works)</option>
                      <option>FOB (Free On Board)</option>
                      <option>CIF (Cost, Insurance & Freight)</option>
                      <option>DDP (Delivered Duty Paid)</option>
                    </select>
                  </div>
                </div>

                {/* Live Summary Breakdown */}
                <div className="bg-slate-900 text-white p-4 rounded-lg grid sm:grid-cols-5 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-slate-400 block text-xs">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Discount (-{calcDiscount}%)</span>
                    <span className="font-semibold text-amber-400">-₹{discountAmt.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Freight</span>
                    <span className="font-semibold">+₹{Number(calcFreight).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">GST ({calcGst}%)</span>
                    <span className="font-semibold">+₹{taxAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-xs font-bold">PROFORMA TOTAL</span>
                    <span className="font-bold text-lg text-emerald-400">
                      ₹{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleSaveProforma}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Issue Proforma Invoice to Buyer
                  </button>
                </div>
              </div>
            )}

            {/* Incoming Buyer RFQs */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Incoming Buyer Quote Requests (RFQs)</h2>
              {quotes.length === 0 ? (
                <p className="text-sm text-slate-500">No buyer RFQs yet. Switch to Buyer Portal to create one.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="p-3">RFQ ID</th>
                        <th className="p-3">Buyer Company</th>
                        <th className="p-3">Product & Qty</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {quotes.map((q) => (
                        <tr key={q.id}>
                          <td className="p-3 font-mono font-semibold">{q.id}</td>
                          <td className="p-3">
                            <div className="font-medium">{q.buyerCompany}</div>
                            <div className="text-xs text-slate-500 font-mono">GSTIN: {q.buyerGstin}</div>
                          </td>
                          <td className="p-3">
                            {q.productName} (<strong>{q.qty}</strong> units)
                          </td>
                          <td className="p-3">{q.status}</td>
                          <td className="p-3">
                            <button
                              onClick={() => openCalculator(q)}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-2 rounded-lg"
                            >
                              {q.proforma ? "Edit Proforma Invoice" : "Calculate Proforma Invoice"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Seller Add Product Form */}
            <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Add Wholesale Product to Catalog
              </h2>
              <div className="grid sm:grid-cols-5 gap-3">
                <input
                  placeholder="Product Name"
                  className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                />
                <input
                  placeholder="SKU (e.g. CHM-501)"
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Unit Price (₹)"
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(Number(e.target.value))}
                  required
                />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm py-2">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
