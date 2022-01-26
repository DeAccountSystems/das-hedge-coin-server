import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, FindOneOptions, FindManyOptions, FindConditions, DeepPartial } from 'typeorm'
import { plainToClass } from 'class-transformer'
import { validateOrReject } from 'class-validator'

interface ExtendRepository<Entity> extends Repository<Entity> {
  fastFindAndCount?: (options: FindManyOptions) => Promise<[Entity[], number]>,
}

@Injectable()
export class BasicService<T> {
  readonly repo: Repository<T>
  readonly Entity: any

  async insert (body: Partial<T>) {
    body = plainToClass(this.Entity, body)

    await validateOrReject(body)

    const res = await this.repo.insert(body as T)
    return res
  }

  async insertMany (items: Array<Partial<T>>) {
    if (this.Entity) {
      for (let i = 0; i < items.length; i++) {
        items[i] = plainToClass(this.Entity, items[i])
        await validateOrReject(this.Entity)
      }
    }
    return await this.repo.insert(items as T[])
  }

  delete (id: number) {
    return this.repo.delete(id)
  }

  find (findManyOptions?: FindManyOptions<T>) {
    return this.repo.find(findManyOptions)
  }

  findOne (condition: FindOneOptions<T>) {
    return this.repo.findOne(condition)
  }

  count (findManyOptions?: FindManyOptions<T>) {
    return this.repo.count(findManyOptions)
  }

  findOneById (id: number) {
    return this.repo.findOne({
      id
    } as any)
  }

  updateOne (id: string, update: DeepPartial<T>) {
    return this.repo.update(id, update)
  }

  update (condition: FindConditions<T>, update: DeepPartial<T>) {
    return this.repo.update(condition, update)
  }
}

export function createBasicService<E> (Entity: any, connection: string) {
  @Injectable()
  class CreatedService extends BasicService<E> {
    Entity = Entity

    constructor (
      @InjectRepository(Entity, connection)
      readonly repo: ExtendRepository<E>,
    ) {
      super()

      repo.fastFindAndCount = async function (options: FindManyOptions): Promise<any> {
        return [
          await repo.find(options),
          await repo.createQueryBuilder()
            .select('count(1)', 'count')
            .where(options.where)
            .orderBy(options.order as any)
            .getRawOne()
            .then(res => Number(res.count))
        ]
      }
    }
  }

  return CreatedService
}
