import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Input,
  Stack,
  Table,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuPencil, LuCheck, LuX } from "react-icons/lu";
import { useEffect, useMemo, useState } from "react";
import { membersService } from "../services/members";
import { paymentsService } from "../services/payments";
import type { CreatePaymentRequest, GetPaymentsQuery, MemberDTO, PaymentResponse, PaymentStatus, UpdatePaymentRequest } from "@alentapp/shared";
import { Field } from "../components/ui/field";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  createListCollection,
} from "../components/ui/select";

const statusOptions = createListCollection({
  items: [
    { label: "Todos", value: "" },
    { label: "Pendiente", value: "Pending" },
    { label: "Pagado", value: "Paid" },
    { label: "Cancelado", value: "Canceled" },
  ],
});

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

export function PaymentsView() {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [memberFilter, setMemberFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<PaymentStatus | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePaymentRequest & Partial<UpdatePaymentRequest>>({
    amount: 0,
    month: currentMonth,
    year: currentYear,
    dueDate: "",
    memberId: "",
  });

  const memberCollection = useMemo(() => {
    return createListCollection({
      items: [
        { label: "Todos", value: "" },
        ...members.map((m) => ({ label: m.name, value: m.id })),
      ],
    });
  }, [members]);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: GetPaymentsQuery = {};
      if (statusFilter) query.status = statusFilter as PaymentStatus;
      if (memberFilter) query.memberId = memberFilter;
      if (monthFilter) query.month = parseInt(monthFilter);
      if (yearFilter) query.year = parseInt(yearFilter);

      const data = await paymentsService.getAll(query);
      setPayments(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los pagos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (err: any) {
      console.error("Error loading members", err);
    }
  };

  const openCreateModal = () => {
    fetchMembers();
    setIsEditMode(false);
    setEditingPaymentId(null);
    setEditingPaymentStatus(null);
    setFormData({
      amount: 0,
      month: currentMonth,
      year: currentYear,
      dueDate: "",
      memberId: "",
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditModal = (payment: PaymentResponse) => {
    setIsEditMode(true);
    setEditingPaymentId(payment.id);
    setEditingPaymentStatus(payment.status);
    setFormData({
      amount: payment.amount,
      month: payment.month,
      year: payment.year,
      dueDate: payment.dueDate.split('T')[0],
      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : undefined,
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    if (!isEditMode && !formData.memberId) {
      return "Seleccione un miembro";
    }
    if (formData.amount !== undefined && (!Number.isFinite(formData.amount) || formData.amount <= 0)) {
      return "El monto debe ser mayor a cero";
    }
    if (formData.month !== undefined && (!Number.isInteger(formData.month) || formData.month < 1 || formData.month > 12)) {
      return "El mes debe estar entre 1 y 12";
    }
    if (formData.year !== undefined && (!Number.isInteger(formData.year) || formData.year <= 2000)) {
      return "El año ingresado no es válido";
    }
    if (!isEditMode && !formData.dueDate) {
      return "Faltan campos requeridos";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (isEditMode && editingPaymentId) {
        const updateData: UpdatePaymentRequest = {};
        if (formData.amount !== undefined) updateData.amount = formData.amount;
        if (formData.month !== undefined) updateData.month = formData.month;
        if (formData.year !== undefined) updateData.year = formData.year;
        if (formData.dueDate !== undefined) updateData.dueDate = formData.dueDate;
        if (formData.paymentDate !== undefined) updateData.paymentDate = formData.paymentDate || undefined;

        await paymentsService.update(editingPaymentId, updateData);
      } else {
        await paymentsService.create(formData as CreatePaymentRequest);
      }
      setIsDialogOpen(false);
      fetchPayments();
    } catch (err: any) {
      setFormError(err.message || (isEditMode ? "Error al actualizar el pago" : "Error al crear el pago"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : memberId;
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    if (!window.confirm('¿Está seguro de que desea marcar este pago como pagado?')) {
      return;
    }

    try {
      await paymentsService.update(paymentId, { status: 'Paid' });
      fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Error al marcar el pago como pagado');
    }
  };

  const handleCancel = async (paymentId: string) => {
    if (!window.confirm('¿Está seguro de que desea cancelar este pago?')) {
      return;
    }

    try {
      await paymentsService.cancel(paymentId);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar el pago');
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, memberFilter, monthFilter, yearFilter]);

  return (
    <Stack gap="8">
      <Flex justify="space-between" align="center">
        <Stack gap="1">
          <Heading size="2xl" fontWeight="bold">Gestión de Pagos</Heading>
          <Text color="fg.muted" fontSize="md">
            Controla las cuotas mensuales de los socios del club.
          </Text>
        </Stack>
        <HStack gap="3">
          <Button variant="outline" onClick={fetchPayments} disabled={isLoading}>
            <LuRefreshCw /> Actualizar
          </Button>
          <Button colorPalette="blue" size="md" onClick={openCreateModal}>
            <LuPlus /> Nuevo Pago
          </Button>
        </HStack>
      </Flex>

      <Flex gap="4" align="center" flexWrap="wrap">
        <Input
          placeholder="Mes (1-12)"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          maxW="120px"
          type="number"
          min="1"
          max="12"
          bg="bg.subtle"
        />
        <Input
          placeholder="Año"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          maxW="130px"
          type="number"
          bg="bg.subtle"
        />
        <SelectRoot
          collection={statusOptions}
          value={[statusFilter]}
          onValueChange={(e) => setStatusFilter(e.value[0] || "")}
        >
          <SelectTrigger bg="bg.subtle" borderWidth="1px" _hover={{ bg: "bg.muted" }} minW="150px">
            <SelectValueText placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.items.map((opt) => (
              <SelectItem item={opt} key={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
        <SelectRoot
          collection={memberCollection}
          value={[memberFilter]}
          onValueChange={(e) => setMemberFilter(e.value[0] || "")}
        >
          <SelectTrigger bg="bg.subtle" borderWidth="1px" _hover={{ bg: "bg.muted" }} minW="200px">
            <SelectValueText placeholder="Socio" />
          </SelectTrigger>
          <SelectContent>
            {memberCollection.items.map((opt) => (
              <SelectItem item={opt} key={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </Flex>

      {error && (
        <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
          <Text fontWeight="bold">Error:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      <Box
        bg="bg.panel"
        borderRadius="xl"
        boxShadow="sm"
        borderWidth="1px"
        overflow="hidden"
        minH="300px"
        position="relative"
      >
        {isLoading ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Spinner size="xl" color="blue.500" />
              <Text color="fg.muted">Cargando pagos...</Text>
            </Stack>
          </Center>
        ) : payments.length === 0 ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Text color="fg.muted">No se encontraron pagos.</Text>
              <Button variant="ghost" onClick={fetchPayments}>Reintentar</Button>
            </Stack>
          </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Monto</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Mes/Año</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Fecha Pago</Table.ColumnHeader>
                <Table.ColumnHeader py="4" w="120px">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payments.map((payment) => (
                <Table.Row key={payment.id} _hover={{ bg: "bg.muted/30" }}>
                  <Table.Cell fontWeight="semibold" color="fg.emphasized">
                    {getMemberName(payment.memberId)}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">${payment.amount.toFixed(2)}</Table.Cell>
                  <Table.Cell color="fg.muted">
                    {payment.month}/{payment.year}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {new Date(payment.dueDate).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Box
                      display="inline-block"
                      px="2"
                      py="0.5"
                      borderRadius="md"
                      bg={
                        payment.status === 'Paid'
                          ? 'green.50'
                          : payment.status === 'Canceled'
                          ? 'red.50'
                          : 'orange.50'
                      }
                      color={
                        payment.status === 'Paid'
                          ? 'green.700'
                          : payment.status === 'Canceled'
                          ? 'red.700'
                          : 'orange.700'
                      }
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {payment.status === 'Paid' ? 'Pagado' : payment.status === 'Canceled' ? 'Cancelado' : 'Pendiente'}
                    </Box>
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap="1">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => openEditModal(payment)}
                      >
                        <LuPencil />
                      </Button>
                      {payment.status === 'Pending' && (
                        <Button
                          size="xs"
                          colorPalette="green"
                          onClick={() => handleMarkAsPaid(payment.id)}
                        >
                          <LuCheck /> Marcar Pagado
                        </Button>
                      )}
                      {(payment.status === 'Pending' || payment.status === 'Paid') && (
                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => handleCancel(payment.id)}
                        >
                          <LuX />
                        </Button>
                      )}
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {isDialogOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex="1000"
          onClick={() => setIsDialogOpen(false)}
        >
          <Box
            bg="bg.panel"
            borderRadius="xl"
            boxShadow="lg"
            borderWidth="1px"
            p="6"
            maxW="500px"
            w="90%"
            onClick={(e) => e.stopPropagation()}
          >
            <Heading size="lg" mb="4">{isEditMode ? "Editar Pago" : "Nuevo Pago"}</Heading>
            <form onSubmit={handleSubmit}>
              <Stack gap="4">
                {formError && (
                  <Box p="3" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                    <Text>{formError}</Text>
                  </Box>
                )}

                {!isEditMode && (
                  <Field label="Socio" required>
                    <SelectRoot
                      collection={createListCollection({
                        items: members.map((m) => ({ label: `${m.name} - ${m.dni}`, value: m.id })),
                      })}
                      value={[formData.memberId]}
                      onValueChange={(e) => setFormData({ ...formData, memberId: e.value[0] })}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Seleccione un socio" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem item={{ label: `${m.name} - ${m.dni}`, value: m.id }} key={m.id}>
                            {m.name} - {m.dni}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}

                <Field label="Monto" required={!isEditMode}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required={!isEditMode}
                  />
                </Field>

                <Flex gap="4">
                  <Field label="Mes" required={!isEditMode} flex="1">
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                      required={!isEditMode}
                    />
                  </Field>
                  <Field label="Año" required={!isEditMode} flex="1">
                    <Input
                      type="number"
                      min="2001"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      required={!isEditMode}
                    />
                  </Field>
                </Flex>

                <Field label="Vencimiento" required={!isEditMode}>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required={!isEditMode}
                  />
                </Field>

                {isEditMode && editingPaymentStatus === 'Paid' && (
                  <Field label="Fecha de Pago">
                    <Input
                      type="date"
                      value={formData.paymentDate || ""}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                  </Field>
                )}

                <Flex justify="flex-end" gap="3" mt="4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                    {isEditMode ? "Guardar Cambios" : <><LuPlus /> Crear Pago</>}
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}
    </Stack>
  );
}