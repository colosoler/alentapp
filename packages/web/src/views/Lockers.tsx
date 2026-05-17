import { useState } from 'react';
import { 
  Box, 
  Button, 
  Flex, 
  Heading, 
  Input, 
  Stack, 
  Text, 
  HStack,
  Center,
  Spinner
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { 
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
  createListCollection
} from "../components/ui/select";
import { toaster } from '../components/ui/toaster';
import { lockerService } from '../services/lockers';
import type { LockerStatus } from '@alentapp/shared';

const statusOptions = createListCollection({
  items: [
    { label: "Disponible", value: "Available" },
    { label: "En Mantenimiento", value: "Maintenance" },
  ],
});

export function Lockers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [number, setNumber] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<LockerStatus>('Available');

  const fetchLockers = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const openCreateModal = () => {
    setNumber('');
    setLocation('');
    setStatus('Available');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await lockerService.create({ 
        number: Number(number), 
        location, 
        status: status === 'Occupied' ? 'Available' : status 
      });
      
      toaster.create({
        title: '¡Locker registrado!',
        description: `El locker #${number} se dio de alta correctamente.`,
        type: 'success',
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      toaster.create({
        title: 'Error de validación',
        description: error.message,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestión de Lockers</Heading>
            <Text color="fg.muted" fontSize="md">
              Administra el alta y estado de los lockers del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLockers} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nuevo Locker
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Alta de nuevo Locker</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número de Locker" required>
                  <Input 
                    type="number" 
                    value={number} 
                    onChange={(e) => setNumber(e.target.value === '' ? '' : Number(e.target.value))} 
                    placeholder="Ej: 101"
                    min={1}
                    required
                  />
                </Field>
                
                <Field label="Ubicación" required>
                  <Input 
                    placeholder="Ej: Pasillo Principal / Vestuario A"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </Field>
                
                <Field label="Estado Inicial">
                  <SelectRoot
                    collection={statusOptions}
                    value={[status]}
                    onValueChange={(e) => setStatus(e.value[0] as LockerStatus)}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.items.map((opt) => (
                        <SelectItem item={opt} key={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Guardar Locker
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

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
                <Text color="fg.muted">Cargando lockers...</Text>
              </Stack>
            </Center>
          ) : (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted" fontWeight="medium">
                  Acá se renderizará la tabla de lockers (Pendiente TDD-0032).
                </Text>
                <Button variant="ghost" onClick={fetchLockers}>Reintentar</Button>
              </Stack>
            </Center>
          )}
        </Box>

      </Stack>
    </DialogRoot>
  );
}