import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import { useState } from "react";
import type { CreateSportRequest, SportDTO } from "@alentapp/shared";
import { Field } from "../components/ui/field";
import { sportsService } from "../services/sport";

export function SportView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdSport, setCreatedSport] = useState<SportDTO | null>(null);
  const [additionalPriceInput, setAdditionalPriceInput] = useState("0");
  const [formData, setFormData] = useState<CreateSportRequest>({
    name: "",
    description: "",
    max_capacity: 1,
    additional_price: 0,
    requires_medical_certificate: false,
  });

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
    if (additionalPriceInput.trim() === "" || !Number.isFinite(additionalPrice) || additionalPrice < 0) {
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
      const sport = await sportsService.create({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        additional_price: Number(additionalPriceInput),
      });

      setCreatedSport(sport);
      setFormData({
        name: "",
        description: "",
        max_capacity: 1,
        additional_price: 0,
        requires_medical_certificate: false,
      });
      setAdditionalPriceInput("0");
    } catch (err: any) {
      setFormError(err.message || "Error al crear el deporte");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="8">
      <Flex justify="space-between" align="center">
        <Stack gap="1">
          <Heading size="2xl" fontWeight="bold">Alta de Deportes</Heading>
          <Text color="fg.muted" fontSize="md">
            Registra nuevas actividades con cupo, precio adicional y requisitos medicos.
          </Text>
        </Stack>
      </Flex>

      <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" p="6">
        <form onSubmit={handleSubmit}>
          <Stack gap="5">
            {formError && (
              <Box p="3" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                <Text>{formError}</Text>
              </Box>
            )}

            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
              gap="4"
            >
              <Field label="Nombre" required>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="Natacion"
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
            </Box>

            <Field label="Descripcion" required>
              <Textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Detalle de la actividad, horarios o condiciones generales"
                minH="120px"
                required
              />
            </Field>

            <Flex justify="flex-end">
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                <LuPlus /> Crear Deporte
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>

      {createdSport && (
        <Box p="4" bg="green.50" color="green.700" borderRadius="md" border="1px solid" borderColor="green.200">
          <Stack gap="1">
            <Text fontWeight="bold">Deporte creado correctamente</Text>
            <Text fontSize="sm">
              {createdSport.name} - Cupo {createdSport.current_enrollment_count}
            </Text>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
