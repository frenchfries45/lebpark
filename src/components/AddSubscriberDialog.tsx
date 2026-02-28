import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Subscriber } from "@/types/subscriber";

interface AddSubscriberDialogProps {
  onAdd: (subscriber: Omit<Subscriber, "id" | "createdAt" | "status">) => void;
}

export function AddSubscriberDialog({ onAdd }: AddSubscriberDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    car: "",
    vehiclePlate: "",
    monthlyFee: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      name: formData.name,
      phone: formData.phone,
      car: formData.car || 'Not Available',
      vehiclePlate: formData.vehiclePlate.toUpperCase(),
      monthlyFee: parseFloat(formData.monthlyFee),
      lastPaymentDate: null,
      validUntil: null,
    });

    setFormData({
      name: "",
      phone: "",
      car: "",
      vehiclePlate: "",
      monthlyFee: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t("actions.addSubscriber")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog.addNewSubscriber")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("subscriber.name")}</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("subscriber.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="car">{t("subscriber.car")}</Label>
            <Input
              id="car"
              placeholder="Toyota Corolla 2020"
              value={formData.car}
              onChange={(e) => setFormData({ ...formData, car: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehiclePlate">{t("subscriber.vehiclePlate")}</Label>
            <Input
              id="vehiclePlate"
              placeholder="ABC 1234"
              value={formData.vehiclePlate}
              onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyFee">{t("subscriber.monthlyFee")} ($)</Label>
            <Input
              id="monthlyFee"
              type="number"
              min="0"
              step="0.01"
              placeholder="150.00"
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit">{t("actions.addSubscriber")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
