import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subscriber } from "@/types/subscriber";

interface EditSubscriberDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: { name: string; phone: string; car: string; vehiclePlate: string; monthlyFee: number }) => void;
}

export function EditSubscriberDialog({ subscriber, open, onOpenChange, onSave }: EditSubscriberDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    car: "",
    vehiclePlate: "",
    monthlyFee: "",
  });

  useEffect(() => {
    if (subscriber && open) {
      setFormData({
        name: subscriber.name,
        phone: subscriber.phone,
        car: subscriber.car,
        vehiclePlate: subscriber.vehiclePlate,
        monthlyFee: subscriber.monthlyFee.toString(),
      });
    }
  }, [subscriber, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriber) return;

    onSave(subscriber.id, {
      name: formData.name,
      phone: formData.phone,
      car: formData.car || 'Not Available',
      vehiclePlate: formData.vehiclePlate.toUpperCase(),
      monthlyFee: parseFloat(formData.monthlyFee),
    });
    onOpenChange(false);
  };

  if (!subscriber) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog.editSubscriber")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t("subscriber.name")}</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t("subscriber.phone")}</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-car">{t("subscriber.car")}</Label>
            <Input
              id="edit-car"
              value={formData.car}
              onChange={(e) => setFormData({ ...formData, car: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-plate">{t("subscriber.vehiclePlate")}</Label>
            <Input
              id="edit-plate"
              value={formData.vehiclePlate}
              onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-fee">{t("subscriber.monthlyFee")} ($)</Label>
            <Input
              id="edit-fee"
              type="number"
              min="0"
              step="0.01"
              value={formData.monthlyFee}
              onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit">{t("actions.save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
