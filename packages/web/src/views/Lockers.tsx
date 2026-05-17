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
  VStack,
  IconButton,
  Menu
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw, LuFilter, LuPenLine, LuMenu } from "react-icons/lu";
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
import type { LockerStatus, LockerItemResponse, MemberDTO } from '@alentapp/shared';
import { membersService } from '../services/members';


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

  const [isRentDialogOpen, setIsRentDialogOpen] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState<LockerItemResponse | null>(null);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isRenting, setIsRenting] = useState(false);

  const [releasingLockerId, setReleasingLockerId] = useState<string | null>(null);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [lockerToRelease, setLockerToRelease] = useState<LockerItemResponse | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingLocker, setEditingLocker] = useState<LockerItemResponse | null>(null);
  const [editNumber, setEditNumber] = useState<number | ''>('');
  const [editLocation, setEditLocation] = useState('');

  const openEditModal = (locker: LockerItemResponse) => {
    setEditingLocker(locker);
    setEditNumber(locker.number);
    setEditLocation(locker.location);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocker) return;
    setIsUpdating(true);

    try {
      await lockerService.update(editingLocker.id, { 
        number: Number(editNumber), 
        location: editLocation 
      });
      
      toaster.create({
        title: 'Locker actualizado',
        description: `Los datos del locker fueron modificados.`,
        type: 'success',
      });
      
      setIsEditDialogOpen(false);
      fetchLockers(statusFilter); 
    } catch (error: any) {
      toaster.create({
        title: 'Error de actualización',
        description: error.message,
        type: 'error',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openReleaseModal = (locker: LockerItemResponse) => {
    setLockerToRelease(locker);
    setIsReleaseDialogOpen(true);
  };

  const confirmRelease = async () => {
    if (!lockerToRelease) return;
    
    setReleasingLockerId(lockerToRelease.id);
    try {
        await lockerService.release(lockerToRelease.id);
        toaster.create({
            title: 'Locker Liberado',
            description: `El locker #${lockerToRelease.number} vuelve a estar disponible.`,
            type: 'success',
        });
        setIsReleaseDialogOpen(false); // Cerramos el modal tras el éxito
        fetchLockers(statusFilter);
    } catch (error: any) {
        toaster.create({
            title: 'No se pudo liberar',
            description: error.message,
            type: 'error',
        });
    } finally {
        setReleasingLockerId(null);
    }
  };

  // Filtrado reactivo de miembros (Por Nombre o DNI)
  const filteredMembers = members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.dni.includes(searchQuery)
  );

  const openRentModal = async (locker: LockerItemResponse) => {
    setSelectedLocker(locker);
    setSearchQuery('');
    setSelectedMemberId('');
    setIsRentDialogOpen(true);
    
    if (members.length === 0) {
        try {
            const data = await membersService.getAll();
            setMembers(data);
        } catch (e) {
            toaster.create({ title: 'Error', description: 'No se pudieron cargar los socios', type: 'error' });
        }
    }
  };

  const handleRent = async () => {
    if (!selectedLocker || !selectedMemberId) return;
    setIsRenting(true);
    try {
        await lockerService.rent(selectedLocker.id, { memberId: selectedMemberId });
        toaster.create({
            title: '¡Alquiler Exitoso!',
            description: `El locker #${selectedLocker.number} fue asignado correctamente.`,
            type: 'success',
        });
        setIsRentDialogOpen(false);
        fetchLockers(statusFilter); // Refrescar grilla
    } catch (error: any) {
        toaster.create({
            title: 'Error de asignación',
            description: error.message,
            type: 'error',
        });
    } finally {
        setIsRenting(false);
    }
};

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
                                <Flex align="center" gap={2}>
                                    <Badge colorPalette={getStatusColor(locker.status)} variant="solid" px={2} py={1} borderRadius="md">
                                        {getStatusLabel(locker.status)}
                                    </Badge>
                                    
                                    <Menu.Root>
                                      <Menu.Trigger asChild>
                                          <IconButton aria-label="Opciones" variant="ghost" size="sm" color="gray.500">
                                              <LuMenu />
                                          </IconButton>
                                      </Menu.Trigger>
                                      <Menu.Content>
                                          <Menu.Item value="edit" onClick={() => openEditModal(locker)}>
                                              <LuPenLine /> Editar Locker
                                          </Menu.Item>
                                      </Menu.Content>
                                  </Menu.Root>

                                </Flex>
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
                                size="sm" colorPalette="blue" 
                                disabled={locker.status !== 'Available'}
                                onClick={() => openRentModal(locker)}
                            >
                                Alquilar
                            </Button>
                            <Button 
                                size="sm"   
                                colorPalette="red" 
                                variant="outline"
                                disabled={locker.status !== 'Occupied'}
                                onClick={() => openReleaseModal(locker)}
                            >
                                Liberar
                            </Button>
                            </Flex>
                        </Card.Footer>
                    </Card.Root>
                ))}
            </Grid>
          )}
          <DialogRoot open={isRentDialogOpen} onOpenChange={(e) => setIsRentDialogOpen(e.open)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Locker #{selectedLocker?.number}</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <Stack gap="4">
                        <Text color="fg.muted" fontSize="sm">
                            Busque el socio por nombre o DNI para asignarle este casillero.
                        </Text>
                        
                        <Field label="Buscar Socio">
                            <Input 
                                placeholder="Escriba DNI o Nombre..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </Field>

                        <Box maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md">
                            {filteredMembers.length === 0 ? (
                                <Box p={3} textAlign="center"><Text fontSize="sm" color="gray.500">No hay resultados</Text></Box>
                            ) : (
                                <Stack gap="0">
                                    {filteredMembers.map((member) => (
                                        <Box 
                                            key={member.id} 
                                            p={3} 
                                            borderBottomWidth="1px"
                                            bg={selectedMemberId === member.id ? 'blue.50' : 'transparent'}
                                            _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                                            onClick={() => setSelectedMemberId(member.id)}
                                        >
                                            <Text fontWeight="semibold" fontSize="sm">{member.name}</Text>
                                            <Text fontSize="xs" color="gray.500">DNI: {member.dni}</Text>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                </DialogBody>
                <DialogFooter>
                    <DialogActionTrigger asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogActionTrigger>
                    <Button 
                        colorPalette="blue" 
                        loading={isRenting} 
                        disabled={!selectedMemberId}
                        onClick={handleRent}
                    >
                        Confirmar Alquiler
                    </Button>
                </DialogFooter>
                <DialogCloseTrigger />
            </DialogContent>
        </DialogRoot>
        <DialogRoot open={isReleaseDialogOpen} onOpenChange={(e) => setIsReleaseDialogOpen(e.open)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Confirmar Liberación</DialogTitle>
              </DialogHeader>
              <DialogBody>
                  <Text>
                      ¿Estás seguro que deseas desvincular al socio y liberar el Locker <strong>#{lockerToRelease?.number}</strong>?
                  </Text>
                  <Text fontSize="sm" color="fg.muted" mt={2}>
                      Esta acción cambiará el estado a "Disponible" y no se puede deshacer.
                  </Text>
              </DialogBody>
              <DialogFooter>
                  <DialogActionTrigger asChild>
                      <Button variant="outline">Cancelar</Button>
                  </DialogActionTrigger>
                  <Button 
                      colorPalette="red" 
                      loading={releasingLockerId === lockerToRelease?.id}
                      onClick={confirmRelease}
                  >
                      Confirmar y Liberar
                  </Button>
              </DialogFooter>
              <DialogCloseTrigger />
          </DialogContent>
        </DialogRoot>
        <DialogRoot open={isEditDialogOpen} onOpenChange={(e) => setIsEditDialogOpen(e.open)}>
          <DialogContent>
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Locker #{editingLocker?.number}</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Stack gap="4">
                  <Field label="Número de Locker" required>
                    <Input 
                      type="number" 
                      value={editNumber} 
                      onChange={(e) => setEditNumber(e.target.value === '' ? '' : Number(e.target.value))} 
                      placeholder="Ej: 101"
                      min={1}
                      required
                    />
                  </Field>
                  
                  <Field label="Ubicación" required>
                    <Input 
                      placeholder="Ej: Pasillo Principal"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      required
                    />
                  </Field>
                </Stack>
              </DialogBody>
              <DialogFooter>
                <DialogActionTrigger asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogActionTrigger>
                <Button type="submit" colorPalette="blue" loading={isUpdating}>
                  Guardar Cambios
                </Button>
              </DialogFooter>
              <DialogCloseTrigger />
            </form>
          </DialogContent>
        </DialogRoot>
        </Box>

      </Stack>
    </DialogRoot>
  );
}