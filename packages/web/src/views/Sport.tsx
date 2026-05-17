import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Table,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { useEffect, useMemo, useState } from "react";
import type { CreateSportRequest, SportDTO } from "@alentapp/shared";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { sportsService } from "../services/sport";

const initialFormData: CreateSportRequest = {
  name: "",
  description: "",
  max_capacity: 1,
  additional_price: 0,
  requires_medical_certificate: false,
};

export function SportView() {
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchName, setSearchName] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [additionalPriceInput, setAdditionalPriceInput] = useState("0");
  const [formData, setFormData] = useState<CreateSportRequest>(initialFormData);

  const filteredSports = useMemo(() => {
    const search = searchName.trim().toLowerCase();

    if (!search) {
      return sports;
    }

    return sports.filter((sport) =>
      sport.name.toLowerCase().includes(search)
    );
  }, [searchName, sports]);

  const fetchSports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sportsService.getAll();
      setSports(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los deportes");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setAdditionalPriceInput("0");
    setFormError(null);
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "El nombre del deporte es obligatorio";
    }

    if (!formData.description.trim()) {
      return "La descripcion del deporte es obligatoria";
    }

    if (!Number.isInteger(formData.max_capacity) || formData.max_capacity <= 0) {
      return "La capacidad maxima debe ser mayor a cero";
    }

    const additionalPrice = Number(additionalPriceInput);
    if (additionalPriceInput.trim() === "" || Number.isNaN(additionalPrice)) {
      return "El precio adicional es obligatorio";
    }

    if (additionalPrice < 0) {
      return "El precio adicional no puede ser negativo";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await sportsService.create({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        additional_price: Number(additionalPriceInput),
      });

      setIsDialogOpen(false);
      await fetchSports();
    } catch (err: any) {
      setFormError(err.message || "Error al crear el deporte");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(event) => setIsDialogOpen(event.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center" gap="4" flexWrap="wrap">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administracion de Deportes</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona actividades deportivas, cupos, precios adicionales y certificados medicos.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={() => fetchSports()} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Deporte
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Deporte</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                {formError && (
                  <Box p="3" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                    <Text>{formError}</Text>
                  </Box>
                )}

                <Field label="Nombre" required>
                  <Input
                    placeholder="Ej. Natacion"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    required
                  />
                </Field>

                <Field label="Descripcion" required>
                  <Textarea
                    placeholder="Detalle de la actividad, horarios o condiciones generales"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    minH="120px"
                    required
                  />
                </Field>

                <Field label="Capacidad maxima" required>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={formData.max_capacity}
                    onChange={(event) => setFormData({ ...formData, max_capacity: Number(event.target.value) })}
                    required
                  />
                </Field>

                <Field label="Precio adicional" required>
                  <Input
                    inputMode="decimal"
                    value={additionalPriceInput}
                    onChange={(event) => setAdditionalPriceInput(event.target.value)}
                    required
                  />
                </Field>

                <Field label="Certificado medico">
                  <Checkbox.Root
                    checked={formData.requires_medical_certificate}
                    onCheckedChange={(details) =>
                      setFormData({
                        ...formData,
                        requires_medical_certificate: Boolean(details.checked),
                      })
                    }
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Requiere certificado medico</Checkbox.Label>
                  </Checkbox.Root>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Crear Deporte
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        <Box>
          <Stack gap="4">
            <Field label="Buscar deporte">
              <Input
                placeholder="Buscar por nombre"
                value={searchName}
                onChange={(event) => setSearchName(event.target.value)}
              />
            </Field>
          </Stack>
        </Box>

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
                <Text color="fg.muted">Cargando deportes...</Text>
              </Stack>
            </Center>
          ) : sports.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron deportes.</Text>
                <Button variant="ghost" onClick={fetchSports}>Reintentar</Button>
              </Stack>
            </Center>
          ) : filteredSports.length === 0 ? (
            <Center h="300px">
              <Text color="fg.muted">No hay deportes para esa busqueda.</Text>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Nombre</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Descripcion</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Cupo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Precio adicional</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Certificado</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredSports.map((sport) => (
                  <Table.Row key={sport.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">
                      {sport.name}
                    </Table.Cell>
                    <Table.Cell color="fg.muted" maxW="360px">
                      {sport.description}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">
                      {sport.current_enrollment_count}/{sport.max_capacity}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">
                      ${sport.additional_price}
                    </Table.Cell>
                    <Table.Cell>
                      <Box
                        display="inline-block"
                        px="2"
                        py="0.5"
                        borderRadius="md"
                        bg={sport.requires_medical_certificate ? "orange.50" : "green.50"}
                        color={sport.requires_medical_certificate ? "orange.700" : "green.700"}
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {sport.requires_medical_certificate ? "Requerido" : "No requerido"}
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}

