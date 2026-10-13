import 'reflect-metadata';
import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Module, Param, Post } from '@nestjs/common';
import { species, trees, zones } from './data';

export type PreviewAdoptionDto = { speciesId: string; zoneId: string; name: string };

export function createPreview(input: PreviewAdoptionDto) {
  if (!input || typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.trim().length > 32 ||
      !species.some((item) => item.id === input.speciesId) || !zones.some((item) => item.id === input.zoneId)) {
    throw new BadRequestException('Selecciona una especie, una zona y un nombre válido.');
  }
  return {
    id: `AD-${Math.floor(1000 + Math.random() * 9000)}`,
    name: input.name.trim(),
    speciesId: input.speciesId,
    zoneId: input.zoneId,
    plantedAt: null,
    status: 'En preparación' as const,
    timeline: [],
    amountUsd: 5,
    charged: false,
  };
}

@Controller()
class AppController {
  @Get('health') health() { return { status: 'ok' }; }

  @Get('catalog') catalog() { return { species, zones }; }

  @Get('trees') listTrees() { return trees; }

  @Get('trees/:id') getTree(@Param('id') id: string) {
    const tree = trees.find((item) => item.id === id);
    if (!tree) throw new HttpException('Árbol no encontrado', HttpStatus.NOT_FOUND);
    return tree;
  }

  @Post('adoptions/preview') preview(@Body() body: PreviewAdoptionDto) {
    return createPreview(body);
  }
}

@Module({ controllers: [AppController] })
export class AppModule {}
