import { useState, useEffect } from 'react';
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
  Spinner,
  Grid,
  Badge,
  Card,
  VStack
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw, LuFilter } from "react-icons/lu";
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
import type { LockerStatus, LockerItemResponse } from '@alentapp/shared';


const statusOptions = createListCollection({
  items: [
    { label: "Disponible", value: "Available" },
    { label: "En Mantenimiento", value: "Maintenance" },
  ],
});

const filterOptions = createListCollection({
  items: [
    { label: "Todos los estados", value: "" },
    { label: "Disponibles", value: "Available" },
    { label: "Ocupados", value: "Occupied" },
    { label: "En Mantenimiento", value: "Maintenance" },
  ],
});

export function Lockers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [number, setNumber] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<LockerStatus>('Available');

  const [lockers, setLockers] = useState<LockerItemResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLockers = async (statusParam?: string) => {
    setIsLoading(true);
    try {
        const data = await lockerService.getAll(statusParam);
        setLockers(data);
    } catch (error) {
        console.error(error);
        toaster.create({
            title: 'Error al cargar',
            description: 'No se pudieron obtener los lockers.',
            type: 'error',
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLockers(statusFilter);
  }, [statusFilter]);

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
        case 'Available': return 'green';
        case 'Occupied': return 'red';
        case 'Maintenance': return 'orange';
        default: return 'gray';
    }
  };

  const getStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
        case 'Available': return 'Disponible';
        case 'Occupied': return 'Ocupado';
        case 'Maintenance': return 'Mantenimiento';
        default: return currentStatus;
    }
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
      fetchLockers(statusFilter); 
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
        
        <Flex justify="space-between" align="center" flexWrap="wrap" gap="4">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestión de Lockers</Heading>
            <Text color="fg.muted" fontSize="md">
              Administra el alta, estado y asignación de los lockers del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={() => fetchLockers(statusFilter)} disabled={isLoading}>
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

        <Flex justify="flex-start" align="center" gap="4">
            <Text fontWeight="medium" display="flex" alignItems="center" gap="2">
                <LuFilter /> Filtrar por estado:
            </Text>
            <Box w="250px">
                <SelectRoot
                    collection={filterOptions}
                    value={[statusFilter]}
                    onValueChange={(e) => setStatusFilter(e.value[0])}
                >
                    <SelectTrigger>
                        <SelectValueText placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions.items.map((opt) => (
                            <SelectItem item={opt} key={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </SelectRoot>
            </Box>
        </Flex>

        <Box
          bg="bg.panel"
          borderRadius="xl"
          boxShadow="sm"
          borderWidth="1px"
          overflow="hidden"
          minH="300px"
          p={6}
        >
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando lockers...</Text>
              </Stack>
            </Center>
          ) : lockers.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted" fontWeight="medium">
                  No se encontraron lockers con los filtros actuales.
                </Text>
                {statusFilter && (
                    <Button variant="ghost" onClick={() => setStatusFilter('')}>
                        Limpiar Filtro
                    </Button>
                )}
              </Stack>
            </Center>
          ) : (
            <Grid 
                templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }} 
                gap={6}
            >
                {lockers.map((locker) => (
                    <Card.Root key={locker.id} variant="elevated">
                        <Card.Header>
                            <Flex justify="space-between" align="center">
                                <Heading size="md">Locker #{locker.number}</Heading>
                                <Badge colorPalette={getStatusColor(locker.status)} variant="solid" px={2} py={1} borderRadius="md">
                                    {getStatusLabel(locker.status)}
                                </Badge>
                            </Flex>
                        </Card.Header>
                        <Card.Body>
                            <VStack align="stretch" gap={3}>
                                <Text fontSize="sm" color="gray.600">
                                    <strong>Ubicación:</strong> {locker.location}
                                </Text>
                                
                                {locker.status === 'Occupied' && locker.member ? (
                                    <Box bg="gray.50" p={3} borderRadius="md" borderWidth="1px" borderColor="gray.200">
                                        <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={1}>
                                            Socio Asignado
                                        </Text>
                                        <Text fontSize="sm" fontWeight="semibold">{locker.member.name}</Text>
                                        <Text fontSize="xs" color="gray.600">DNI: {locker.member.dni}</Text>
                                    </Box>
                                ) : (
                                    <Box p={3} minH="74px" display="flex" alignItems="center">
                                        <Text fontSize="sm" color="gray.400" fontStyle="italic">
                                            Sin asignar
                                        </Text>
                                    </Box>
                                )}
                            </VStack>
                        </Card.Body>
                        <Card.Footer>
                            <Flex justify="flex-end" w="100%" gap={2}>
                                <Button 
                                    size="sm" 
                                    colorPalette="blue" 
                                    disabled={locker.status !== 'Available'}
                                    onClick={() => alert('Próximamente: TDD 0033 (Alquilar)')}
                                >
                                    Alquilar
                                </Button>
                                <Button 
                                    size="sm" 
                                    colorPalette="red" 
                                    variant="outline"
                                    disabled={locker.status !== 'Occupied'}
                                    onClick={() => alert('Próximamente: TDD 0034 (Liberar)')}
                                >
                                    Liberar
                                </Button>
                            </Flex>
                        </Card.Footer>
                    </Card.Root>
                ))}
            </Grid>
          )}
        </Box>

      </Stack>
    </DialogRoot>
  );
}