import React from 'react';

export function Card({ children, style = {}, title, actions }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      ...style,
    }}>
      {(title || actions) && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{title}</h3>}
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, loading, style = {}, type = 'button' }) {
  const variants = {
    primary: { background: '#3b82f6', color: '#fff', border: 'none' },
    secondary: { background: '#f1f5f9', color: '#374151', border: '1px solid #e5e7eb' },
    danger: { background: '#ef4444', color: '#fff', border: 'none' },
    success: { background: '#22c55e', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6' },
  };
  const sizes = {
    sm: { padding: '5px 10px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 15 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        borderRadius: 8,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.15s',
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
    >
      {loading ? '⏳' : null}
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text', required, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          padding: '8px 12px',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: 8,
          fontSize: 13,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, value, onChange, children, style = {}, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 13,
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
    </div>
  );
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: { background: '#dbeafe', color: '#1d4ed8' },
    green: { background: '#dcfce7', color: '#15803d' },
    red: { background: '#fee2e2', color: '#b91c1c' },
    yellow: { background: '#fef9c3', color: '#854d0e' },
    purple: { background: '#f3e8ff', color: '#7e22ce' },
    gray: { background: '#f3f4f6', color: '#374151' },
  };
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      ...colors[color],
    }}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max = 100, color = '#3b82f6', height = 8 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ background: '#e5e7eb', borderRadius: height, overflow: 'hidden', height }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width 0.4s' }} />
    </div>
  );
}

export function Spinner({ size = 24 }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `3px solid #e5e7eb`,
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

export function Alert({ type = 'info', children }) {
  const styles = {
    info: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' },
    error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' },
    success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
    warning: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' },
  };
  const icons = { info: 'ℹ️', error: '❌', success: '✅', warning: '⚠️' };
  return (
    <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start', ...styles[type] }}>
      <span>{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 4, style = {}, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 13,
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
      {icon && <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>}
      <h3 style={{ margin: '0 0 8px', color: '#374151', fontSize: 16 }}>{title}</h3>
      {description && <p style={{ margin: '0 0 16px', fontSize: 13 }}>{description}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, color = '#3b82f6', sub }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: 18,
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: 0.8 }}>{icon}</div>
      </div>
    </div>
  );
}
