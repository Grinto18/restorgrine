/**
 * GRINE RESTAURANT POS - Kitchen Display System (KDS)
 * Multi-column workflow: NEW -> PREPARING -> READY -> COMPLETED
 * Routes tickets by Kitchen Station: GRILL, PIZZA, TACOS, SEAFOOD, DESSERT, DRINKS, MAIN KITCHEN.
 * Includes elapsed timers, audio chime, and KOT thermal printing.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { KitchenTicket, KitchenStation, KitchenStatus } from '../types/pos';
import {
  ChefHat,
  Clock,
  Printer,
  CheckCircle2,
  Play,
  Check,
  Flame,
  Utensils,
  Filter,
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { kitchenTickets, updateTicketStatus, printKitchenTicket, t } = usePOS();

  const [selectedStation, setSelectedStation] = useState<string>('all');

  const stations: { id: KitchenStation | 'all'; label: string }[] = [
    { id: 'all', label: t.allStations },
    { id: 'MAIN_KITCHEN', label: t.stationMain },
    { id: 'PIZZA', label: t.stationPizza },
    { id: 'GRILL', label: t.stationGrill },
    { id: 'SEAFOOD', label: t.stationSeafood },
    { id: 'TACOS', label: t.stationTacos },
    { id: 'DESSERT', label: t.stationDessert },
    { id: 'DRINKS', label: t.stationDrinks },
  ];

  const columns: { id: KitchenStatus; label: string; color: string; badge: string }[] = [
    { id: 'NEW', label: t.statusNew, color: 'border-amber-500/50 bg-amber-950/20', badge: 'bg-amber-500 text-slate-950' },
    { id: 'PREPARING', label: t.statusPreparing, color: 'border-blue-500/50 bg-blue-950/20', badge: 'bg-blue-500 text-white' },
    { id: 'READY', label: t.statusReady, color: 'border-emerald-500/50 bg-emerald-950/20', badge: 'bg-emerald-500 text-white' },
    { id: 'COMPLETED', label: t.statusCompleted, color: 'border-slate-700 bg-slate-900/40 opacity-75', badge: 'bg-slate-700 text-slate-200' },
  ];

  // Filter tickets by station
  const filteredTickets = kitchenTickets.filter((ticket) => {
    if (selectedStation === 'all') return true;
    return ticket.station === selectedStation;
  });

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const handlePrintKOT = (ticket: KitchenTicket) => {
    printKitchenTicket(ticket);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 select-none">
      {/* Top Bar: Stations Filter */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-amber-400" />
          <h2 className="font-extrabold text-slate-100 text-base">{t.kdsTitle}</h2>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar">
          {stations.map((s) => {
            const isSelected = selectedStation === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStation(s.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Column KDS Board */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {columns.map((col) => {
          const ticketsInCol = filteredTickets.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border flex flex-col overflow-hidden ${col.color}`}
            >
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
                <span className="font-extrabold text-slate-200 text-sm">{col.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${col.badge}`}>
                  {ticketsInCol.length}
                </span>
              </div>

              {/* Tickets List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {ticketsInCol.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-500 text-center p-4">
                    {t.noActiveTickets}
                  </div>
                ) : (
                  ticketsInCol.map((ticket) => {
                    const elapsed = getElapsedMinutes(ticket.createdAt);
                    const isUrgent = elapsed >= 15;
                    const isWarning = elapsed >= 8 && elapsed < 15;

                    return (
                      <div
                        key={ticket.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md flex flex-col justify-between space-y-3"
                      >
                        {/* Ticket Header: Order #, Table, Timer, Station */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-amber-400 text-sm">
                              {ticket.orderNumber}
                            </span>
                            <span
                              className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                                isUrgent
                                  ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                                  : isWarning
                                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{elapsed} د</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                            <span>
                              {ticket.tableNumber ? `طاولة ${ticket.tableNumber}` : ticket.orderType.toUpperCase()}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-amber-500/80 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {ticket.station}
                            </span>
                          </div>
                        </div>

                        {/* Items Checklist */}
                        <div className="border-t border-b border-slate-800/80 py-2 space-y-2">
                          {ticket.items.map((item) => (
                            <div key={item.id} className="text-xs">
                              <div className="flex items-baseline justify-between">
                                <span className="font-black text-slate-100 text-sm">
                                  {item.quantity} x {item.productNameAr}
                                </span>
                              </div>

                              {item.selectedVariant && (
                                <div className="text-[11px] text-amber-400 font-semibold ps-4">
                                  ({item.selectedVariant.nameAr})
                                </div>
                              )}

                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-[10px] text-slate-400 ps-4">
                                  + {item.modifiers.map((m) => m.nameAr).join(', ')}
                                </div>
                              )}

                              {item.notes && (
                                <div className="text-[11px] text-amber-300 font-bold bg-amber-950/40 p-1 rounded border border-amber-900/60 mt-1">
                                  ⚠️ {item.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Actions for this Ticket */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handlePrintKOT(ticket)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title={t.printKOT}
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {col.id === 'NEW' && (
                            <button
                              type="button"
                              onClick={() => updateTicketStatus(ticket.id, 'PREPARING')}
                              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>{t.startPreparing}</span>
                            </button>
                          )}

                          {col.id === 'PREPARING' && (
                            <button
                              type="button"
                              onClick={() => updateTicketStatus(ticket.id, 'READY')}
                              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{t.markReady}</span>
                            </button>
                          )}

                          {col.id === 'READY' && (
                            <button
                              type="button"
                              onClick={() => updateTicketStatus(ticket.id, 'COMPLETED')}
                              className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.markCompleted}</span>
                            </button>
                          )}

                          {col.id === 'COMPLETED' && (
                            <div className="flex-1 text-center text-[10px] text-slate-500 py-1 font-mono">
                              مكتمل
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
