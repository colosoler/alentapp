import {
  Table,
  Button,
  Heading,
  HStack,
  Stack,
  Text,
  Box,
  Flex,
  Spinner,
  Center,
  Input
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuFilter, LuTrash2, LuCheck, LuSlidersHorizontal } from "react-icons/lu";
import { useEffect, useState, useMemo } from "react"; // Añadido useMemo
import { loansService } from "../services/loans";
import type { LoanWithMemberDTO } from "@alentapp/shared";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  createListCollection
} from "../components/ui/select";
import { membersService } from "../services/members";
import type { MemberDTO } from "@alentapp/shared";

const statusOptions = createListCollection({
  items: [
    { label: "Todos", value: "" },
    { label: "Prestado", value: "Loaned" },
    { label: "Devuelto", value: "Returned" },
    { label: "Dañado", value: "Damaged" },
  ],
});

export function LoansView() {
  const [loans, setLoans] = useState<LoanWithMemberDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<string | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [loanToReturn, setLoanToReturn] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    member_id: "",
    item_name: "",
    due_date: "",
  });

  // SOLUCIÓN AL ERROR: Creamos la colección de socios de forma segura
  const memberCollection = useMemo(() => {
    return createListCollection({
      items: members.map((m) => ({
        label: m.name,
        value: m.id,
      })),
    });
  }, [members]);

  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: any = {};
      if (statusFilter) query.status = statusFilter;
      if (searchQuery) query.search = searchQuery;
      const data = await loansService.getAll(query);
      setLoans(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los préstamos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await membersService.getAll();
      // Actualizado: usamos 'Cadet' para filtrar (según tus nuevas categorías)
      setMembers(data.filter(m => m.category !== 'Cadet'));
    } catch (err: any) {
      console.error("Error loading members", err);
    }
  };

  const openCreateModal = () => {
    setFormData({ member_id: "", item_name: "", due_date: "" });
    fetchMembers();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loansService.create(formData);
      setIsDialogOpen(false);
      fetchLoans();
    } catch (err: any) {
      alert(err.message || "Error al crear el préstamo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!loanToDelete) return;
    setIsSubmitting(true);
    try {
      await loansService.delete(loanToDelete);
      setIsDeleteDialogOpen(false);
      setLoanToDelete(null);
      fetchLoans();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el préstamo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setLoanToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const openReturnDialog = (id: string) => {
    setLoanToReturn(id);
    setIsReturnDialogOpen(true);
  };

  const handleReturn = async (status: 'Returned' | 'Damaged') => {
    if (!loanToReturn) return;
    setIsSubmitting(true);
    try {
      await loansService.updateStatus(loanToReturn, { status });
      setIsReturnDialogOpen(false);
      setLoanToReturn(null);
      fetchLoans();
    } catch (err: any) {
      alert(err.message || "Error al devolver el préstamo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestión de Préstamos</Heading>
            <Text color="fg.muted" fontSize="md">
              Controla el material prestado a los socios del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLoans} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nuevo Préstamo
            </Button>
          </HStack>
        </Flex>

<Flex gap="4" align="center">
          <Input
            placeholder="Buscar por socio o ítem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLoans()}
            maxW="300px"
          />
          <SelectRoot
            collection={statusOptions}
            value={[statusFilter]}
            onValueChange={(e) => {
              setStatusFilter(e.value[0] || "");
            }}
          >
            <SelectTrigger
              bg="bg.subtle"
              borderWidth="1px"
              _hover={{ bg: "bg.muted" }}
            >
              <LuSlidersHorizontal />
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
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Nuevo Préstamo</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <SelectRoot
                    collection={memberCollection} // Usamos la colección memoizada
                    value={[formData.member_id]}
                    onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberCollection.items.map((m) => (
                        <SelectItem item={m} key={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                <Field label="Nombre del Ítem" required>
                  <Input
                    placeholder="Ej. Raqueta de tennis"
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Fecha de Devolución" required>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Crear Préstamo
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        <DialogRoot open={isDeleteDialogOpen} onOpenChange={(e) => {
          setIsDeleteDialogOpen(e.open);
          if (!e.open) setLoanToDelete(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>¿Está seguro de que desea eliminar este préstamo? Esta acción no se puede deshacer.</Text>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button colorPalette="red" onClick={handleDelete} loading={isSubmitting}>
                Eliminar
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>

        <DialogRoot open={isReturnDialogOpen} onOpenChange={(e) => {
          setIsReturnDialogOpen(e.open);
          if (!e.open) setLoanToReturn(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Devolver Préstamo</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>Seleccione el estado en que devuelve el material:</Text>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <HStack gap="2">
                <Button colorPalette="green" onClick={() => handleReturn('Returned')} loading={isSubmitting}>
                  <LuCheck /> En buen estado
                </Button>
                <Button colorPalette="orange" onClick={() => handleReturn('Damaged')} loading={isSubmitting}>
                  <LuTrash2 /> Dañado
                </Button>
              </HStack>
            </DialogFooter>
            <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>

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
                <Text color="fg.muted">Cargando préstamos...</Text>
              </Stack>
            </Center>
          ) : loans.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron préstamos.</Text>
                <Button variant="ghost" onClick={fetchLoans}>Reintentar</Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Ítem</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha Préstamo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha Devolución</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" w="80px">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {loans.map((loan) => {
                  const overdue = loan.status === 'Loaned' && isOverdue(loan.due_date);
                  return (
                    <Table.Row
                      key={loan.id}
                      _hover={{ bg: "bg.muted/30" }}
                      bg={overdue ? "red.50" : undefined}
                    >
                      <Table.Cell fontWeight="semibold" color="fg.emphasized">
                        {loan.member.name}
                      </Table.Cell>
                      <Table.Cell color="fg.muted">{loan.item_name}</Table.Cell>
                      <Table.Cell color="fg.muted">
                        {new Date(loan.loan_date).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell color={overdue ? "red.600" : "fg.muted"} fontWeight={overdue ? "bold" : undefined}>
                        {new Date(loan.due_date).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <Box
                          display="inline-block"
                          px="2"
                          py="0.5"
                          borderRadius="md"
                          bg={
                            loan.status === 'Loaned'
                              ? overdue
                                ? 'red.100'
                                : 'blue.50'
                              : loan.status === 'Returned'
                              ? 'green.50'
                              : 'orange.50'
                          }
                          color={
                            loan.status === 'Loaned'
                              ? overdue
                                ? 'red.700'
                                : 'blue.700'
                              : loan.status === 'Returned'
                              ? 'green.700'
                              : 'orange.700'
                          }
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {loan.status === 'Loaned' ? (overdue ? 'Vencido' : 'Prestado') : loan.status === 'Returned' ? 'Devuelto' : 'Dañado'}
                        </Box>
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap="1">
                          <Button
                            size="xs"
                            colorPalette="green"
                            onClick={() => openReturnDialog(loan.id)}
                            disabled={loan.status !== 'Loaned'}
                          >
                            <LuCheck /> Devolver
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            onClick={() => openDeleteDialog(loan.id)}
                            disabled={loan.status !== 'Loaned'}
                          >
                            <LuTrash2 />
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}