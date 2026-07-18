import { Check, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { formatUSD } from "@/lib/pricing";

interface CartAddedToastProps {
  toastId: string | number;
  image: string;
  title: string;
  details: string;
  quantity: number;
  unitPrice: number;
  onViewBag: () => void;
}

function CartAddedToast({
  toastId,
  image,
  title,
  details,
  quantity,
  unitPrice,
  onViewBag,
}: CartAddedToastProps) {
  return (
    <div className="w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden border border-[#d9d3c9] bg-[#fffefa] text-[#171717] shadow-[0_24px_70px_rgba(24,20,15,0.18)]">
      <div className="flex items-center border-b border-[#ece7df] px-4 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#171717] text-white">
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <p className="ml-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em]">
          Added to your bag
        </p>
        <button
          type="button"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Dismiss notification"
          className="ml-auto p-1 text-[#8c857b] transition-colors hover:text-[#171717]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex gap-4 p-4">
        <div className="h-[86px] w-[76px] shrink-0 overflow-hidden bg-[#f2efe9]">
          <img src={image} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <p className="line-clamp-2 font-display text-[1.12rem] leading-[1.15]">{title}</p>
          <p className="mt-1.5 truncate text-[0.65rem] uppercase tracking-[0.1em] text-[#817a70]">
            {details}
          </p>
          <div className="mt-auto flex items-end justify-between pt-3">
            <span className="text-[0.68rem] text-[#817a70]">Qty {quantity}</span>
            <span className="font-display text-xl leading-none">
              {formatUSD(unitPrice * quantity)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          toast.dismiss(toastId);
          onViewBag();
        }}
        className="flex w-full items-center justify-center gap-2 bg-[#171717] px-4 py-3.5 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#2b2926]"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        View bag
      </button>
    </div>
  );
}

export function showCartAddedToast(props: Omit<CartAddedToastProps, "toastId">) {
  toast.custom((toastId) => <CartAddedToast toastId={toastId} {...props} />, {
    duration: 5000,
    position: "top-right",
  });
}
