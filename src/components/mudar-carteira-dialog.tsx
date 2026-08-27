import { useState, useEffect } from "react";
import { ArrowLeftRight, Briefcase, Check, UserCheck, User } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { empresaToForm, updateEmpresa, useEmpresas } from "@/lib/empresas-store";
import {
  useCadastros,
  resolverSupervisorPorCarteira,
  resolverAnalistaPorCarteira,
  resolverVinculoPorAnalista,
} from "@/lib/cadastros-store";
import { carteiraDaEmpresa, listarNomesCarteiras } from "@/lib/carteiras-core";
import type { Empresa } from "@/lib/mock-data";

interface MudarCarteiraDialogProps {
  empresa: Empresa | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: (novaCarteira: string) => void;
  className?: string;
}

export function MudarCarteiraDialog({
  empresa,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
  className,
}: MudarCarteiraDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      setControlledOpen?.(val);
    } else {
      setInternalOpen(val);
    }
  };

  const { todasEmpresas } = useEmpresas({ ignorarEscopo: true });
  const { carteiras, analistas, supervisores } = useCadastros();

  const [carteiraSelecionada, setCarteiraSelecionada] = useState(empresa?.carteira || "");
  const [analistaSelecionado, setAnalistaSelecionado] = useState(empresa?.analista || "");
  const [supervisorSelecionado, setSupervisorSelecionado] = useState(empresa?.supervisor || "");

  // Lista consolidada de todas as carteiras disponíveis
  const listaCarteiras = listarNomesCarteiras(todasEmpresas, carteiras);

  useEffect(() => {
    if (open && empresa) {
      setCarteiraSelecionada(empresa.carteira || "");
      setAnalistaSelecionado(empresa.analista || "");
      setSupervisorSelecionado(empresa.supervisor || "");
    }
  }, [open, empresa]);

  const handleCarteiraChange = (novaCarteira: string) => {
    setCarteiraSelecionada(novaCarteira);

    // Auto-preenche o analista vinculado a essa carteira, se houver
    const anal = resolverAnalistaPorCarteira(novaCarteira);
    if (anal) {
      setAnalistaSelecionado(anal);
    }

    // Auto-preenche o supervisor associado a essa carteira, se houver
    const sup = resolverSupervisorPorCarteira(novaCarteira);
    if (sup) {
      setSupervisorSelecionado(sup);
    }
  };

  const handleAnalistaChange = (novoAnalista: string) => {
    setAnalistaSelecionado(novoAnalista);
    const vinculo = resolverVinculoPorAnalista(novoAnalista);
    if (vinculo.supervisor) {
      setSupervisorSelecionado(vinculo.supervisor);
    }
  };

  const handleSalvar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!carteiraSelecionada) {
      toast.error("Por favor, selecione uma carteira de destino.");
      return;
    }

    try {
      const formAtual = empresaToForm(empresa);
      const atualizada = updateEmpresa(empresa.id, {
        ...formAtual,
        carteira: carteiraSelecionada,
        analista: analistaSelecionado || formAtual.analista,
        supervisor: supervisorSelecionado || formAtual.supervisor,
      });

      if (!atualizada) {
        toast.error("Não foi possível atualizar a empresa.");
        return;
      }

      toast.success(`Carteira de "${empresa.nome}" alterada com sucesso!`, {
        description: `Nova carteira: ${carteiraSelecionada} • Analista: ${analistaSelecionado || atualizada.analista}`,
      });

      setOpen(false);
      onSuccess?.(carteiraSelecionada);
    } catch (err) {
      console.error("Erro ao mudar carteira:", err);
      toast.error("Erro ao transferir carteira.");
    }
  };

  if (!empresa) return null;

  const carteiraAtual = carteiraDaEmpresa(empresa);
  const codDominio = empresa.codigoDominio || empresa.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className={className}
          >
            {trigger}
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            title={`Mudar carteira de "${empresa.nome}"`}
            className="group/carteira-btn inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -ml-1.5 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-all cursor-pointer border border-transparent hover:border-primary/20 max-w-full text-left"
          >
            <span className="truncate font-semibold">{carteiraAtual || "Sem Carteira"}</span>
            <ArrowLeftRight className="h-3 w-3 opacity-40 group-hover/carteira-btn:opacity-100 group-hover/carteira-btn:text-primary transition-all shrink-0" />
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className="max-w-md sm:rounded-xl p-6 shadow-2xl border bg-background"
      >
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Mudar Carteira</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Transfira a empresa para outra carteira operacional de atendimento.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* CARTÃO RESUMO DA EMPRESA */}
        <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{empresa.nome}</p>
              <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                {codDominio && <span>Cód. {codDominio}</span>}
                {empresa.cnpj && <span>• {empresa.cnpj}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-border/50 text-[11px]">
            <span className="text-muted-foreground">Carteira atual:</span>
            <Badge variant="outline" className="font-medium bg-background text-[11px] py-0 px-2">
              {carteiraAtual}
            </Badge>
          </div>
        </div>

        {/* FORMULÁRIO DE SELEÇÃO */}
        <div className="space-y-4 py-2 text-xs">
          {/* SELETOR DE CARTEIRA */}
          <div className="space-y-1.5">
            <Label htmlFor="nova-carteira" className="text-xs font-semibold flex items-center justify-between">
              <span>Nova Carteira Operacional *</span>
            </Label>
            <Select value={carteiraSelecionada} onValueChange={handleCarteiraChange}>
              <SelectTrigger id="nova-carteira" className="w-full text-xs h-9">
                <SelectValue placeholder="Selecione a carteira de destino" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {listaCarteiras.map((nome) => {
                  const isCurrent = nome === carteiraAtual;
                  return (
                    <SelectItem key={nome} value={nome} className="text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={isCurrent ? "font-semibold text-primary" : ""}>{nome}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-muted-foreground font-normal">(atual)</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* ANALISTA */}
          <div className="space-y-1.5">
            <Label htmlFor="novo-analista" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> Analista Responsável
            </Label>
            <Select value={analistaSelecionado} onValueChange={handleAnalistaChange}>
              <SelectTrigger id="novo-analista" className="w-full text-xs h-9">
                <SelectValue placeholder="Selecione o analista" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {analistas.map((a) => (
                  <SelectItem key={a.id} value={a.nome} className="text-xs">
                    {a.nome} {a.cargo ? `(${a.cargo})` : ""}
                  </SelectItem>
                ))}
                {!analistas.some((a) => a.nome === analistaSelecionado) && analistaSelecionado && (
                  <SelectItem value={analistaSelecionado} className="text-xs">
                    {analistaSelecionado}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* SUPERVISOR */}
          <div className="space-y-1.5">
            <Label htmlFor="novo-supervisor" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Supervisor Responsável
            </Label>
            <Select value={supervisorSelecionado} onValueChange={setSupervisorSelecionado}>
              <SelectTrigger id="novo-supervisor" className="w-full text-xs h-9">
                <SelectValue placeholder="Selecione o supervisor" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {supervisores.map((s) => (
                  <SelectItem key={s.id} value={s.nome} className="text-xs">
                    {s.nome}
                  </SelectItem>
                ))}
                {!supervisores.some((s) => s.nome === supervisorSelecionado) && supervisorSelecionado && (
                  <SelectItem value={supervisorSelecionado} className="text-xs">
                    {supervisorSelecionado}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
            className="text-xs h-8"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSalvar}
            disabled={!carteiraSelecionada || carteiraSelecionada === carteiraAtual && analistaSelecionado === empresa.analista && supervisorSelecionado === empresa.supervisor}
            className="text-xs h-8 gap-1.5"
          >
            <Check className="h-3.5 w-3.5" /> Salvar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
