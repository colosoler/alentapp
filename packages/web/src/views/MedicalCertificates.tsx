import {
  Button,
  Heading,
  HStack,
  Stack,
  Text,
  Box,
  Input,
  
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { LuTrash2 } from "react-icons/lu";
import { useEffect, useState } from "react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  createListCollection,
} from "../components/ui/select";
import { medicalCertificatesService } from "../services/medicalCertificates";
import { membersService } from "../services/members";
import type { MedicalCertificateDTO, CreateMedicalCertificateRequest, MemberDTO } from "@alentapp/shared";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";

export function MedicalCertificatesView() {
  const [certs, setCerts] = useState<MedicalCertificateDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateMedicalCertificateRequest>({ member_id: "", issue_date: "" });
  const [errors, setErrors] = useState<{ member_id?: string; issue_date?: string; expiration_date?: string }>({});

  const fetch = async () => {
    setIsLoading(true);
    try {
      const data = await medicalCertificatesService.getAll();
      setCerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, memberId: string) => {
    try {
      if (!window.confirm(`¿Está seguro de que desea eliminar este certificado del socio "${memberId}"? Esta acción no se puede deshacer.`)) return;
      await medicalCertificatesService.delete(id);
      fetch();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el certificado');
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const openCreate = async () => {
    setForm({ member_id: "", issue_date: "" });
    setErrors({});
    fetchMembers();
    setIsOpen(true);
  };

  const fetchMembers = async () => {
    try {
      const m = await membersService.getAll();
      setMembers(m.filter((x) => x.category !== 'Cadete'));
    } catch (e) {
      console.error(e);
      setMembers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend validations
    const newErrors: typeof errors = {};
    if (!form.member_id) newErrors.member_id = 'Faltan campos requeridos';

    const parseValidDate = (value: string): Date | null => {
      const dateMatch = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
      if (!dateMatch) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);
      const calendarDate = new Date(Date.UTC(year, month - 1, day));
      if (
        calendarDate.getUTCFullYear() !== year ||
        calendarDate.getUTCMonth() !== month - 1 ||
        calendarDate.getUTCDate() !== day
      ) {
        return null;
      }
      return date;
    };

    const issueDate = parseValidDate(form.issue_date || '');
    if (!form.issue_date) {
      newErrors.issue_date = 'Faltan campos requeridos';
    } else if (!issueDate) {
      newErrors.issue_date = 'La fecha de emision no es valida';
    }

    const expVal = (form as any).expiration_date;
    if (expVal) {
      const expDate = parseValidDate(expVal);
      if (!expDate) {
        newErrors.expiration_date = 'La fecha de vencimiento no es valida';
      } else if (issueDate && expDate <= issueDate) {
        newErrors.expiration_date = 'La fecha de vencimiento debe ser posterior a la de emision';
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await medicalCertificatesService.create(form as any);
      setIsOpen(false);
      fetch();
    } catch (err: any) {
      alert(err.message || 'Error al crear certificado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Stack gap="8">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack>
            <Heading size="2xl">Certificados Médicos</Heading>
            <Text color="fg.muted">Listado de certificados y gestión.</Text>
          </Stack>
          <HStack>
            <Button variant="outline" onClick={fetch} disabled={isLoading}><LuRefreshCw /> Actualizar</Button>
            <Button colorPalette="blue" onClick={openCreate}><LuPlus /> Nuevo Certificado</Button>
          </HStack>
        </Box>

        <table>
          <thead>
            <tr>
              <th>Socio</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.id}>
                <td>{c.member_id}</td>
                <td>{c.issue_date}</td>
                <td>{c.expiration_date || '-'}</td>
                <td>{c.status}</td>
                <td style={{ textAlign: 'right' }}>
                  <button aria-label="Eliminar certificado" onClick={() => handleDelete(c.id, c.member_id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <LuTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <DialogContent>
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Nuevo Certificado Médico</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required errorText={errors.member_id}>
                  <SelectRoot
                    collection={createListCollection({ items: members.map((m) => ({ label: m.name, value: m.id })) })}
                    value={[form.member_id]}
                    onValueChange={(e) => {
                      setForm({ ...form, member_id: e.value[0] || '' });
                      setErrors(prev => ({ ...prev, member_id: undefined }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem item={{ label: m.name, value: m.id }} key={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                  {errors.member_id && (
                    <Box color="red.600" fontSize="sm">{errors.member_id}</Box>
                  )}

                <Field label="Fecha de emisión" required errorText={errors.issue_date}>
                  <Input type="date" value={form.issue_date} onChange={(e) => { setForm({ ...form, issue_date: e.target.value }); setErrors(prev => ({ ...prev, issue_date: undefined })); }} />
                </Field>
                  {errors.issue_date && (
                    <Box color="red.600" fontSize="sm">{errors.issue_date}</Box>
                  )}

                <Field label="Fecha de vencimiento (opcional)" errorText={errors.expiration_date}>
                  <Input type="date" value={(form as any).expiration_date || ''} onChange={(e) => { setForm({ ...(form as any), expiration_date: e.target.value }); setErrors(prev => ({ ...prev, expiration_date: undefined })); }} />
                </Field>
                  {errors.expiration_date && (
                    <Box color="red.600" fontSize="sm">{errors.expiration_date}</Box>
                  )}
              </Stack>
            </DialogBody>
            <DialogFooter>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Stack>
    </DialogRoot>
  );
}

export default MedicalCertificatesView;
