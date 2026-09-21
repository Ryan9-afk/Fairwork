"use client";

import React, { useState } from "react";
import { ShieldCheck, MapPin, Filter, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubCountyRisk {
  name: string;
  county: string;
  workerCount: number;
  totalUnpaidClaims: number; // in KSh
  safetyIncidents: number;
  unpaidOvertimeRate: string;
  primaryRiskSector: string;
  riskLevel: "high" | "medium" | "low";
}

const SUB_COUNTY_DATA: SubCountyRisk[] = [
  {
    name: "Kilimani / Dagoretti",
    county: "Nairobi",
    workerCount: 142,
    totalUnpaidClaims: 184500,
    safetyIncidents: 19,
    unpaidOvertimeRate: "68%",
    primaryRiskSector: "Commercial Construction",
    riskLevel: "high",
  },
  {
    name: "Embakasi East",
    county: "Nairobi",
    workerCount: 98,
    totalUnpaidClaims: 112000,
    safetyIncidents: 14,
    unpaidOvertimeRate: "54%",
    primaryRiskSector: "Warehousing & Logistics",
    riskLevel: "high",
  },
  {
    name: "Naivasha Sub-County",
    county: "Nakuru",
    workerCount: 86,
    totalUnpaidClaims: 78400,
    safetyIncidents: 8,
    unpaidOvertimeRate: "42%",
    primaryRiskSector: "Floriculture & Greenhouse",
    riskLevel: "medium",
  },
  {
    name: "Nakuru West",
    county: "Nakuru",
    workerCount: 64,
    totalUnpaidClaims: 54200,
    safetyIncidents: 5,
    unpaidOvertimeRate: "39%",
    primaryRiskSector: "Residential Masonry",
    riskLevel: "medium",
  },
  {
    name: "Kisumu Central",
    county: "Kisumu",
    workerCount: 52,
    totalUnpaidClaims: 41000,
    safetyIncidents: 3,
    unpaidOvertimeRate: "28%",
    primaryRiskSector: "Transport & Boda Delivery",
    riskLevel: "low",
  },
];

interface RegulatorDashboardProps {
  onBack: () => void;
}

export function RegulatorDashboard({ onBack }: RegulatorDashboardProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>("All");

  const filtered = selectedCounty === "All"
    ? SUB_COUNTY_DATA
    : SUB_COUNTY_DATA.filter((d) => d.county === selectedCounty);

  const totalClaims = SUB_COUNTY_DATA.reduce((sum, d) => sum + d.totalUnpaidClaims, 0);
  const totalWorkers = SUB_COUNTY_DATA.reduce((sum, d) => sum + d.workerCount, 0);
  const totalInjuries = SUB_COUNTY_DATA.reduce((sum, d) => sum + d.safetyIncidents, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <Button variant="iosPlain" onClick={onBack} className="text-xs font-semibold text-gray-600 gap-1.5 pl-0">
          <ArrowLeft size={16} /> Back to My Vault
        </Button>
        <span className="text-[10px] font-semibold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100 flex items-center gap-1">
          <ShieldCheck size={12} /> k-Anonymity Verified (k ≥ 5)
        </span>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-indigo-200 tracking-wider uppercase">
              Union & Regulatory Intelligence Console
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Kenya Labour Rights Regional Monitor
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
            Illustrative regional patterns for discussion. A production dashboard would require informed consent, data minimisation, and a verified privacy review.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-700/60">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Audited Claims</span>
              <strong className="text-lg font-bold text-emerald-400">
                KSh {totalClaims.toLocaleString("en-KE")}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Logged Casuals</span>
              <strong className="text-lg font-bold text-white">{totalWorkers} workers</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">WIBA Violations</span>
              <strong className="text-lg font-bold text-amber-400">{totalInjuries} reports</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Heatmap List */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-700">Filter County:</span>
          {["All", "Nairobi", "Nakuru", "Kisumu"].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCounty(c)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                selectedCounty === c
                  ? "bg-slate-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <Button
          variant="iosPlain"
          size="sm"
          onClick={() => window.print()}
          className="text-xs text-blue-600 gap-1"
        >
          <Download size={14} /> Export Brief
        </Button>
      </div>

      {/* Sub-County Risk Table / Cards */}
      <div className="space-y-2.5">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-300 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-blue-600 shrink-0" />
                <strong className="text-sm font-bold text-gray-900">
                  {item.name}
                </strong>
                <span className="text-[11px] text-gray-400">({item.county})</span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    item.riskLevel === "high"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : item.riskLevel === "medium"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {item.riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Primary hotspot: <span className="font-semibold text-gray-700">{item.primaryRiskSector}</span> · {item.workerCount} contributing workers
              </p>
            </div>

            <div className="flex items-center gap-4 text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Unpaid Total</span>
                <strong className="text-xs font-mono font-bold text-red-600">
                  KSh {item.totalUnpaidClaims.toLocaleString("en-KE")}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Overtime Infraction</span>
                <strong className="text-xs font-mono font-bold text-gray-800">
                  {item.unpaidOvertimeRate}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Safety</span>
                <strong className="text-xs font-mono font-bold text-amber-600">
                  {item.safetyIncidents} WIBA
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 text-[11px] text-gray-500 leading-relaxed flex items-start gap-2">
        <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
        <div>
          <strong>Illustrative privacy threshold:</strong> This sample view shows the intended minimum-count rule. Production use requires a consented dataset, privacy review, and verified aggregation pipeline.
        </div>
      </div>
    </div>
  );
}
