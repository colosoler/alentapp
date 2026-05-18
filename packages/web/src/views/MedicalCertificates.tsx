import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuPencil, LuPlus, LuRefreshCw, LuSearch, LuTrash2 } from "react-icons/lu";
import { createListCollection, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValueText } from "../components/ui/select";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { medicalCertificatesService } from "../services/medicalCertificates";
import { membersService } from "../services/members";
import type { CreateMedicalCertificateRequest, MedicalCertificateDTO, MemberDTO, MemberMedicalCertificateStatusResponse, UpdateMedicalCertificateRequest } from "@alentapp/shared";

const formatDate = (value?: string) => {
  if (!value) return "-";

  const [year, month, day] = value.split("T")[0].split("-");
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
};

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

const statusLabels: Record<MedicalCertificateDTO["status"], string> = {
  Active: "Activo",
  Inactive: "Inactivo",
};

const statusCollection = createListCollection({
  items: [
    { label: "Todos", value: "" },
    { label: "Activo", value: "Active" },
    { label: "Inactivo", value: "Inactive" },
  ],
});

type CertificateFormState = {
  member_id: string;
  issue_date: string;
  expiration_date: string;
  status: MedicalCertificateDTO["status"];
};

const emptyFormState: CertificateFormState = {
  member_id: "",
  issue_date: "",
  expiration_date: "",
  status: "Active",
};

export function MedicalCertificatesView() {
  const [certs, setCerts] = useState<MedicalCertificateDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCertificateId, setEditingCertificateId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CertificateFormState>(emptyFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [memberFilter, setMemberFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchById, setSearchById] = useState("");
  const [searchedCertificate, setSearchedCertificate] = useState<MedicalCertificateDTO | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [memberLookupId, setMemberLookupId] = useState("");
  const [memberLookupCertificates, setMemberLookupCertificates] = useState<MedicalCertificateDTO[]>([]);
  const [memberLookupStatus, setMemberLookupStatus] = useState<MemberMedicalCertificateStatusResponse | null>(null);

  const memberCollection = useMemo(() => {
    return createListCollection({
      items: members.map((member) => ({
        label: `${member.name} - ${member.dni}`,
        value: member.id,
      })),
    });
  }, [members]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [certificates, allMembers] = await Promise.all([
        medicalCertificatesService.getAll(),
        membersService.getAll(),
      ]);
      setCerts(certificates);
      setMembers(allMembers);
    } catch (err: any) {
      setError(err.message || "Error al cargar los certificados médicos");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAndKeepLookups = async () => {
    await loadData();
  };

  const filteredCertificates = useMemo(() => {
    return certs.filter((certificate) => {
      if (memberFilter && certificate.member_id !== memberFilter) {
        return false;
      }

      if (statusFilter && certificate.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [certs, memberFilter, statusFilter]);

  const totalActiveCertificates = certs.filter((certificate) => certificate.status === "Active").length;
  const totalMembersWithActiveCertificate = new Set(
    certs.filter((certificate) => certificate.status === "Active").map((certificate) => certificate.member_id),
  ).size;

  const selectedMember = members.find((member) => member.id === memberLookupId) || null;

  const openCreateModal = () => {
    setEditingCertificateId(null);
    setFormData(emptyFormState);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditModal = (certificate: MedicalCertificateDTO) => {
    setEditingCertificateId(certificate.id);
    setFormData({
      member_id: certificate.member_id,
      issue_date: certificate.issue_date.split("T")[0],
      expiration_date: certificate.expiration_date ? certificate.expiration_date.split("T")[0] : "",
      status: certificate.status,
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSearchById = async () => {
    const query = searchById.trim();
    if (!query) {
      setSearchError("Ingresá un ID para buscar");
      setSearchedCertificate(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const certificate = await medicalCertificatesService.getById(query);
      setSearchedCertificate(certificate);
    } catch (err: any) {
      setSearchedCertificate(null);
      setSearchError(err.message || "No se encontró el certificado");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDelete = async (certificate: MedicalCertificateDTO) => {
    const member = members.find((item) => item.id === certificate.member_id);
    const memberLabel = member ? `${member.name} - ${member.dni}` : certificate.member_id;

    if (!window.confirm(`¿Está seguro de que desea eliminar el certificado de ${memberLabel}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await medicalCertificatesService.delete(certificate.id);
      await refreshAndKeepLookups();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el certificado");
    }
  };

  const handleViewFile = (certificate: MedicalCertificateDTO) => {
    if (!certificate.file_url) return;
    window.open(certificate.file_url, '_blank');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: { member_id?: string; issue_date?: string; expiration_date?: string; status?: string } = {};

    const issueDate = parseValidDate(formData.issue_date);
    const expirationDate = formData.expiration_date ? parseValidDate(formData.expiration_date) : null;

    if (!editingCertificateId && !formData.member_id) {
      nextErrors.member_id = "Faltan campos requeridos";
    }

    if (!formData.issue_date) {
      nextErrors.issue_date = "Faltan campos requeridos";
    } else if (!issueDate) {
      nextErrors.issue_date = "La fecha de emision no es valida";
    }

    if (formData.expiration_date) {
      if (!expirationDate) {
        nextErrors.expiration_date = "La fecha de vencimiento no es valida";
      } else if (issueDate && expirationDate <= issueDate) {
        nextErrors.expiration_date = "La fecha de vencimiento debe ser posterior a la de emision";
      }
    }

    setFormError(Object.values(nextErrors)[0] || null);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCertificateId) {
        const updateData: UpdateMedicalCertificateRequest = {
          issueDate: formData.issue_date,
          expirationDate: formData.expiration_date || undefined,
          status: formData.status,
        };

        if (selectedFile) {
          const fd = new FormData();
          fd.append('file', selectedFile, selectedFile.name);
          fd.append('issueDate', updateData.issueDate || '');
          if (updateData.expirationDate) fd.append('expirationDate', updateData.expirationDate);
          if (updateData.status) fd.append('status', updateData.status);
          await medicalCertificatesService.update(editingCertificateId, fd);
        } else {
          await medicalCertificatesService.update(editingCertificateId, updateData);
        }
      } else {
        const createData: CreateMedicalCertificateRequest = {
          member_id: formData.member_id,
          issue_date: formData.issue_date,
          expiration_date: formData.expiration_date || undefined,
        };

        if (selectedFile) {
          const fd = new FormData();
          fd.append('file', selectedFile, selectedFile.name);
          fd.append('member_id', createData.member_id);
          fd.append('issue_date', createData.issue_date);
          if (createData.expiration_date) fd.append('expiration_date', createData.expiration_date);
          await medicalCertificatesService.create(fd);
        } else {
          await medicalCertificatesService.create(createData);
        }
      }

      setIsDialogOpen(false);
      setEditingCertificateId(null);
      setFormData(emptyFormState);
      setFormError(null);
      await refreshAndKeepLookups();
    } catch (err: any) {
      setFormError(err.message || (editingCertificateId ? "Error al actualizar el certificado" : "Error al crear el certificado"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadMemberView = async () => {
      if (!memberLookupId) {
        setMemberLookupStatus(null);
        setMemberLookupCertificates([]);
        return;
      }

      try {
        const [status, certificates] = await Promise.all([
          medicalCertificatesService.getMemberStatus(memberLookupId),
          medicalCertificatesService.getByMember(memberLookupId),
        ]);
        setMemberLookupStatus(status);
        setMemberLookupCertificates(certificates);
      } catch (err) {
        console.error(err);
        setMemberLookupStatus(null);
        setMemberLookupCertificates([]);
      }
    };

    loadMemberView();
  }, [memberLookupId]);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(event) => setIsDialogOpen(event.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center" gap="4" wrap="wrap">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Certificados Médicos</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona altas, actualizaciones, eliminaciones y consultas del historial médico de cada socio.
            </Text>
          </Stack>
          <HStack gap="3" wrap="wrap">
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nuevo Certificado
            </Button>
          </HStack>
        </Flex>

        <HStack gap="4" wrap="wrap">
          <Box flex="1" minW="180px" bg="bg.panel" borderWidth="1px" borderRadius="xl" p="4" boxShadow="sm">
            <Text color="fg.muted" fontSize="sm">Total certificados</Text>
            <Heading size="xl">{certs.length}</Heading>
          </Box>
          <Box flex="1" minW="180px" bg="bg.panel" borderWidth="1px" borderRadius="xl" p="4" boxShadow="sm">
            <Text color="fg.muted" fontSize="sm">Activos</Text>
            <Heading size="xl">{totalActiveCertificates}</Heading>
          </Box>
          <Box flex="1" minW="180px" bg="bg.panel" borderWidth="1px" borderRadius="xl" p="4" boxShadow="sm">
            <Text color="fg.muted" fontSize="sm">Socios con certificado activo</Text>
            <Heading size="xl">{totalMembersWithActiveCertificate}</Heading>
          </Box>
        </HStack>

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" p="5">
          <Stack gap="4">
            <Heading size="md">Consulta rápida</Heading>
            <Flex gap="3" wrap="wrap" align="end">
              <Field label="Buscar por ID de certificado">
                <Input
                  value={searchById}
                  onChange={(event) => setSearchById(event.target.value)}
                  placeholder="Pegá el ID del certificado"
                  minW="280px"
                />
              </Field>
              <Button onClick={handleSearchById} loading={searchLoading} colorPalette="blue">
                <LuSearch /> Buscar
              </Button>
            </Flex>

            {searchError && (
              <Box p="3" bg="red.50" color="red.700" borderRadius="md" borderWidth="1px" borderColor="red.200">
                <Text fontWeight="bold">No se pudo consultar:</Text>
                <Text>{searchError}</Text>
              </Box>
            )}

            {searchedCertificate ? (
              <Box p="4" borderRadius="lg" borderWidth="1px" bg="blue.50">
                <HStack justify="space-between" align="start" wrap="wrap">
                  <Stack gap="1">
                    <Text fontSize="sm" color="blue.700" fontWeight="bold">Certificado encontrado</Text>
                    <Heading size="md">{formatDate(searchedCertificate.issue_date)} - {statusLabels[searchedCertificate.status]}</Heading>
                    <Text color="blue.700">ID: {searchedCertificate.id}</Text>
                  </Stack>
                  <Button size="sm" variant="outline" onClick={() => openEditModal(searchedCertificate)}>
                    <LuPencil /> Editar
                  </Button>
                </HStack>
              </Box>
            ) : null}

            <Flex gap="4" wrap="wrap">
              <Field label="Ver certificados de un socio">
                <SelectRoot
                  collection={memberCollection}
                  value={memberLookupId ? [memberLookupId] : []}
                  onValueChange={(event) => setMemberLookupId(event.value[0] || "")}
                >
                  <SelectTrigger minW="280px">
                    <SelectValueText placeholder="Seleccioná un socio" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberCollection.items.map((member) => (
                      <SelectItem item={member} key={member.value}>
                        {member.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Field>

              {memberLookupStatus && (
                <Box flex="1" minW="260px" p="4" bg={memberLookupStatus.hasActiveCertificate ? "green.50" : "orange.50"} borderRadius="lg" borderWidth="1px">
                  <Text fontSize="sm" color={memberLookupStatus.hasActiveCertificate ? "green.700" : "orange.700"} fontWeight="bold">
                    Estado del socio
                  </Text>
                  <Heading size="sm" mt="1">
                    {memberLookupStatus.hasActiveCertificate ? "Tiene certificado activo" : "No tiene certificado activo"}
                  </Heading>
                  <Text color="fg.muted" mt="1">
                    {selectedMember ? `${selectedMember.name} - ${selectedMember.dni}` : memberLookupStatus.memberId}
                  </Text>
                </Box>
              )}
            </Flex>

            {memberLookupCertificates.length > 0 && (
              <Box>
                <Text fontWeight="bold" mb="2">Certificados del socio</Text>
                <Table.Root size="sm" variant="line">
                  <Table.Header>
                    <Table.Row bg="bg.muted/50">
                      <Table.ColumnHeader py="3">ID</Table.ColumnHeader>
                      <Table.ColumnHeader py="3">Emisión</Table.ColumnHeader>
                      <Table.ColumnHeader py="3">Vencimiento</Table.ColumnHeader>
                      <Table.ColumnHeader py="3">Estado</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {memberLookupCertificates.map((certificate) => (
                      <Table.Row key={certificate.id}>
                        <Table.Cell color="fg.muted">{certificate.id}</Table.Cell>
                        <Table.Cell color="fg.muted">{formatDate(certificate.issue_date)}</Table.Cell>
                        <Table.Cell color="fg.muted">{formatDate(certificate.expiration_date)}</Table.Cell>
                        <Table.Cell>
                          <Box display="inline-block" px="2" py="0.5" borderRadius="md" bg={certificate.status === "Active" ? "green.50" : "gray.100"} color={certificate.status === "Active" ? "green.700" : "gray.700"} fontSize="xs" fontWeight="bold">
                            {statusLabels[certificate.status]}
                          </Box>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Stack>
        </Box>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" borderWidth="1px" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px" position="relative">
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando certificados médicos...</Text>
              </Stack>
            </Center>
          ) : filteredCertificates.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron certificados médicos.</Text>
                <Button variant="ghost" onClick={loadData}>Reintentar</Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Emisión</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Vigencia</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredCertificates.map((certificate) => {
                  const member = members.find((item) => item.id === certificate.member_id);
                  const isActive = certificate.status === "Active";

                  return (
                    <Table.Row key={certificate.id} _hover={{ bg: "bg.muted/30" }} bg={isActive ? "green.50" : undefined}>
                      <Table.Cell fontWeight="semibold" color="fg.emphasized">
                        {member ? `${member.name} - ${member.dni}` : certificate.member_id}
                      </Table.Cell>
                      <Table.Cell color="fg.muted">{formatDate(certificate.issue_date)}</Table.Cell>
                      <Table.Cell color="fg.muted">{formatDate(certificate.expiration_date)}</Table.Cell>
                      <Table.Cell>
                        <Box display="inline-block" px="2" py="0.5" borderRadius="md" bg={isActive ? "green.50" : "gray.100"} color={isActive ? "green.700" : "gray.700"} fontSize="xs" fontWeight="bold">
                          {statusLabels[certificate.status]}
                        </Box>
                      </Table.Cell>
                      <Table.Cell color={isActive ? "green.700" : "fg.muted"} fontWeight={isActive ? "bold" : undefined}>
                        {isActive ? "Certificado vigente" : "Histórico"}
                      </Table.Cell>
                      <Table.Cell textAlign="end">
                        <HStack gap="2" justify="flex-end">
                          <IconButton variant="ghost" size="sm" aria-label="Editar certificado" onClick={() => openEditModal(certificate)}>
                            <LuPencil />
                          </IconButton>
                          {certificate.file_url && (
                            <IconButton variant="ghost" size="sm" aria-label="Ver archivo" onClick={() => handleViewFile(certificate)}>
                              <LuSearch />
                            </IconButton>
                          )}
                          <IconButton variant="ghost" size="sm" colorPalette="red" aria-label="Eliminar certificado" onClick={() => handleDelete(certificate)}>
                            <LuTrash2 />
                          </IconButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        <DialogContent>
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>{editingCertificateId ? "Editar Certificado Médico" : "Nuevo Certificado Médico"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                {editingCertificateId ? (
                  <Box p="3" borderWidth="1px" borderRadius="md" bg="bg.subtle">
                    <Text fontSize="sm" color="fg.muted">Socio</Text>
                    <Text fontWeight="semibold">
                      {members.find((member) => member.id === formData.member_id)?.name || formData.member_id}
                    </Text>
                  </Box>
                ) : (
                  <Field label="Socio" required errorText={formError || undefined}>
                    <SelectRoot
                      collection={memberCollection}
                      value={formData.member_id ? [formData.member_id] : []}
                      onValueChange={(event) => {
                        setFormData({ ...formData, member_id: event.value[0] || "" });
                        setFormError(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Seleccione un socio" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberCollection.items.map((member) => (
                          <SelectItem item={member} key={member.value}>
                            {member.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}

                <Field label="Fecha de emisión" required>
                  <Input
                    type="date"
                    value={formData.issue_date}
                    onChange={(event) => {
                      setFormData({ ...formData, issue_date: event.target.value });
                      setFormError(null);
                    }}
                  />
                </Field>

                <Field label="Fecha de vencimiento (opcional)">
                  <Input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(event) => {
                      setFormData({ ...formData, expiration_date: event.target.value });
                      setFormError(null);
                    }}
                  />
                </Field>

                <Field label="Adjuntar PNG (opcional)">
                  <input
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    type="file"
                    accept="image/png"
                    onChange={(e) => {
                      setFileError(null);
                      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      if (!file) {
                        setSelectedFile(null);
                        setFilePreview(null);
                        return;
                      }

                      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
                      const maxBytes = 5 * 1024 * 1024;
                      if (!isPng) {
                        setFileError('El archivo debe ser en formato PNG');
                        setSelectedFile(null);
                        setFilePreview(null);
                        return;
                      }

                      if (file.size > maxBytes) {
                        setFileError('El archivo no debe superar 5MB');
                        setSelectedFile(null);
                        setFilePreview(null);
                        return;
                      }

                      setSelectedFile(file);
                      const url = URL.createObjectURL(file);
                      setFilePreview(url);
                    }}
                  />

                  <Flex gap="2" align="center">
                    <Button
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      size="sm"
                    >
                      Seleccionar archivo PNG
                    </Button>
                    {selectedFile ? (
                      <HStack gap="2">
                        <Text fontSize="sm">{selectedFile.name}</Text>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedFile(null); setFilePreview(null); setFileError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                          Quitar
                        </Button>
                      </HStack>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">Ningún archivo seleccionado</Text>
                    )}
                  </Flex>

                  {fileError && (
                    <Box mt="2" color="red.600" fontSize="sm">{fileError}</Box>
                  )}

                  {filePreview && (
                    <Box mt="2">
                      <Text fontSize="sm">Preview:</Text>
                      <Box as="img" src={filePreview} maxW="200px" borderRadius="md" mt="1" />
                    </Box>
                  )}
                </Field>

                {editingCertificateId && (
                  <Field label="Estado">
                    <SelectRoot
                      collection={createListCollection({
                        items: [
                          { label: "Activo", value: "Active" },
                          { label: "Inactivo", value: "Inactive" },
                        ],
                      })}
                      value={[formData.status]}
                      onValueChange={(event) => {
                        setFormData({ ...formData, status: (event.value[0] as MedicalCertificateDTO["status"]) || "Active" });
                        setFormError(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Seleccione un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem item={{ label: "Activo", value: "Active" }} key="active">
                          Activo
                        </SelectItem>
                        <SelectItem item={{ label: "Inactivo", value: "Inactive" }} key="inactive">
                          Inactivo
                        </SelectItem>
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}

                {!editingCertificateId && (
                  <Box p="3" borderRadius="md" bg="blue.50" color="blue.700" borderWidth="1px" borderColor="blue.200">
                    Al crear un certificado nuevo, los certificados activos anteriores del mismo socio se invalidan automáticamente.
                  </Box>
                )}

                {formError && (
                  <Box color="red.600" fontSize="sm">{formError}</Box>
                )}
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingCertificateId ? "Guardar Cambios" : "Crear Certificado"}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </Stack>
    </DialogRoot>
  );
}

export default MedicalCertificatesView;
