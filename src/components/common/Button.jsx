export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-mint text-white shadow-sm hover:bg-[#6d28d9]",
    secondary: "bg-white text-slate-100 border border-line shadow-sm hover:border-slate-400 hover:bg-panel2",
    ghost: "bg-transparent text-slate-300 hover:bg-mint/10 hover:text-mint",
    danger: "bg-rose text-white shadow-sm hover:bg-rose/85"
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
