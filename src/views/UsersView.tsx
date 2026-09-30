/**
 * GRINE RESTAURANT POS - Users & Access Control Management View
 * Roles: ADMIN, MANAGER, CASHIER, KITCHEN with 4-digit PIN authentication.
 */

import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { User, UserRole } from '../types/pos';
import { Users, UserPlus, Shield, KeyRound, Check, X, Edit2 } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, createUser, updateUser, currentUser, t } = usePOS();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('CASHIER');

  const handleOpenAdd = () => {
    setFormName('');
    setFormUsername('');
    setFormPin('');
    setFormRole('CASHIER');
    setEditingUser(null);
    setIsAddUserOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPin(user.pin);
    setFormRole(user.role);
    setIsAddUserOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || formPin.length !== 4) return;

    if (editingUser) {
      updateUser({
        ...editingUser,
        name: formName.trim(),
        username: formUsername.trim() || formName.trim().toLowerCase().replace(/\s+/g, '_'),
        pin: formPin,
        role: formRole,
      });
    } else {
      createUser({
        name: formName.trim(),
        username: formUsername.trim() || formName.trim().toLowerCase().replace(/\s+/g, '_'),
        pin: formPin,
        role: formRole,
        active: true,
      });
    }
    setIsAddUserOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>{t.navUsers} وإدارة الصلاحيات</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            إدارة حسابات الكاشير، المشرفين، طاقم المطبخ ورموز PIN السريعة
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map((user) => {
            const isSelf = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-base">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-100 text-sm">{user.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                      user.role === 'ADMIN'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : user.role === 'MANAGER'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : user.role === 'KITCHEN'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>رمز PIN:</span>
                  </span>
                  <span className="text-amber-400 font-bold tracking-widest">
                    {/* Masked PIN unless self or admin */}
                    {currentUser.role === 'ADMIN' ? user.pin : '••••'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>{user.active ? 'نشط' : 'معطل'}</span>
                    {isSelf && <span className="text-amber-400 ms-1">(أنت)</span>}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(user)}
                    className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                    title="تعديل المستخدم"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: يوسف كاشير"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  رمز PIN السريع (4 أرقام)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-center tracking-widest text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">الدور والصلاحية</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="CASHIER">CASHIER (أمين صندوق / مبيعات وطاولات)</option>
                  <option value="MANAGER">MANAGER (مشرف صالة ومخزون وتقارير)</option>
                  <option value="ADMIN">ADMIN (المدير العام - كافة الصلاحيات)</option>
                  <option value="KITCHEN">KITCHEN (شاشة المطبخ KDS)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!formName.trim() || formPin.length !== 4}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-50"
              >
                حفظ المستخدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
