export default function ShoppingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lista de Compras</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Generada automáticamente desde tu plan semanal.
        </p>
      </div>
      <div className="card p-8 text-center">
        <p className="text-4xl mb-3">🚧</p>
        <h2 className="font-semibold text-lg mb-1">En construcción</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          La lista de compras se implementa en la Fase 4.
        </p>
      </div>
    </div>
  );
}
